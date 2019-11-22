'use strict';

const _ = require('lodash'),
  moment = require('moment'),
  db = require('./db'),
  sanitize = require('../universal/sanitize'),
  utils = require('../universal/utils'),
  log = require('../universal/log').setup({ file: __filename }),
  canonicalProtocol = 'http',
  bluebird = require('bluebird'),
  rest = require('../../services/universal/rest'),
  slugifyService = require('../../services/universal/slugify'),
  urlPatterns = require('../universal/url-patterns'),
  { PAGE_TYPES } = require('../universal/constants'),
  /**
   * returns a url to the server for a component
   *
   * @param {string} uri
   * @returns {string}
   */
  componentUri = (uri) => uri.replace(/([^/]+)(.*)/, `${canonicalProtocol}://$1$2`),
  /**
   * gets a component instance
   *
   * @param {string} uri
   * @param {object} opts
   * @returns {Promise}
   */
  getComponentInstance = (uri, opts) => rest.get(componentUri(uri), opts),
  /**
   * adds/updates a component instance
   *
   * @param {string} uri
   * @param {object} body
   * @returns {Promise}
   */
  putComponentInstance = (uri, body) => rest.put(componentUri(uri), body, true);

/**
 * Checks provided ref to determine whether it is a main component (article or lede-video)
 * @param {string} ref
 * @param {object} mainComponentRefs
 * @returns {boolean}
 */
function isMainComponentReference(ref, mainComponentRefs) {
  let match = false;

  if (_.isString(ref)) {
    _.each(mainComponentRefs, function (componentRef) {
      if (ref.indexOf(componentRef) > -1) {
        match = true;
      }
    });
  }

  return match;
}

/**
 * Gets the first reference to a main component within a page (if it exists)
 * @param {object} page
 * @param {object} mainComponentRefs
 * @returns {string|undefined}
 */
function getComponentReference(page, mainComponentRefs) {
  for (const key in page) {
    if (page.hasOwnProperty(key)) {
      const value = page[key];

      if (isMainComponentReference(value, mainComponentRefs)) {
        return value;
      } else if (_.isObject(value)) {
        const result = _.isArray(value) ? _.find(value, function (o) { return isMainComponentReference(o, mainComponentRefs); }) : getComponentReference(value, mainComponentRefs);

        if (result) {
          return result;
        }
      }
    }
  }
}

/**
 * @param {object} mainComponent
 */
function guaranteePrimaryHeadline(mainComponent) {
  if (!mainComponent.primaryHeadline) {
    throw new Error('Client: missing primary headline');
  }
}

/**
 * Logic about which date to use for a published article
 * @param {object} latest
 * @param {object} [published]
 * @returns {string}
 */
function getPublishDate(latest, published) {
  if (_.isObject(latest) && latest.date) {
    // if we're given a date, use it
    return latest.date;
  } else if (_.isObject(published) && published.date) {
    // if there is only a date on the published version, use it
    return published.date;
  } else {
    return new Date().toISOString();
  }
}

/**
 * @param {object} component
 * @param {object} publishedComponent
 * @param {object} locals
 */
function guaranteeLocalDate(component, publishedComponent, locals) {
  // if date is defined in the component, remember it.
  if (!locals.date) {
    locals.date = getPublishDate(component, publishedComponent);
  }
}

/**
 * gets a main component from the db by its ref, ensuring primary headline and date exist
 * @param {string} componentReference
 * @param {object} locals
 * @returns {Promise}
 */
function getMainComponentFromRef(componentReference, locals) {
  return bluebird.all([
    db.get(componentReference)
      .catch(function (error) {
        log('error', `Failure to fetch component at ${componentReference}`);
        throw error;
      }),
    db.get(componentReference + '@published')
      .catch(_.noop)
  ]).spread(function (component, publishedComponent) {
    const componentTypeRegex = /^.*_components\/(\b.+\b)\/instances.*$/g,
      pageType = componentTypeRegex.exec(componentReference)[1] || null;

    if ([PAGE_TYPES.ARTICLE, PAGE_TYPES.GALLERY, PAGE_TYPES.EVENT].includes(pageType)) {
      guaranteePrimaryHeadline(component);
      guaranteeLocalDate(component, publishedComponent, locals);
    }

    return { component, pageType };
  });
}

/**
 * Return the URL prefix of a site.
 * @param {object} site e.g. {prefix: 'localhost.thecut.com', proto: 'http'}
 * @returns {string} e.g. 'http://localhost.thecut.com'
 */
function getUrlPrefix(site) {
  const proto = site && site.proto || canonicalProtocol,
    urlPrefix = utils.uriToUrl(site.prefix, { site: { protocol: proto } });

  return _.trimEnd(urlPrefix, '/'); // never has a trailing slash; newer lodash uses `trimEnd`
}

/**
 * returns an object to be consumed by url patterns
 * @param {object} component
 * @param {object} locals
 * @param {string} pageType
 * @returns {{prefix: string, sectionFront: string, contentType: string, yyyy: string, mm: string, slug: string, isEvergreen: boolean, title: string, pageType: string}}
 * @throws {Error} if there's no date, slug, or prefix
 */
function getUrlOptions(component, locals, pageType) {
  const urlOptions = {},
    date = moment(locals.date);

  urlOptions.prefix = getUrlPrefix(locals.site);
  urlOptions.sectionFront = component.stationFront ? component.stationSiteSlug || component.title : slugifyService(component.sectionFront || component.title) || null;
  urlOptions.secondarySectionFront = slugifyService(component.secondarySectionFront) || null;
  urlOptions.primarySectionFront = component.primary && component.primarySectionFront ? null : slugifyService(component.primarySectionFront);
  urlOptions.contentType = component.contentType || null;
  urlOptions.yyyy = date.format('YYYY') || null;
  urlOptions.mm = date.format('MM') || null;
  urlOptions.slug = component.stationFront ? component.stationSiteSlug : component.title || component.slug || sanitize.cleanSlug(component.primaryHeadline) || null;
  urlOptions.isEvergreen = component.evergreenSlug || null;
  urlOptions.pageType = pageType;
  urlOptions.stationSlug = component.stationSlug || '';

  if ([PAGE_TYPES.ARTICLE, PAGE_TYPES.GALLERY, PAGE_TYPES.EVENT].includes(urlOptions.pageType)) {
    if (!(locals.site && locals.date && urlOptions.slug)) {
      throw new Error('Client: Cannot generate a canonical url at prefix: ' +
        locals.site && locals.site.prefix + ' slug: ' + urlOptions.slug + ' date: ' + locals.date);
    }
  } else if (urlOptions.pageType === PAGE_TYPES.SECTIONFRONT) {
    if (!(locals.site && urlOptions.sectionFront)) {
      throw new Error('Client: Cannot generate a canonical url at prefix: ' +
        locals.site && locals.site.prefix + ' title: ' + urlOptions.sectionFront);
    }
  } else if (urlOptions.pageType === PAGE_TYPES.AUTHOR) {
    urlOptions.contentType = 'authors';
    urlOptions.author = component.author;
    urlOptions.authorSlug = slugifyService(component.author);
  }

  return urlOptions;
}

module.exports.getComponentReference = getComponentReference;
module.exports.getMainComponentFromRef = getMainComponentFromRef;
module.exports.getUrlOptions = getUrlOptions;
module.exports.getUrlPrefix = getUrlPrefix;
module.exports.getPublishDate = getPublishDate;
module.exports.putComponentInstance = putComponentInstance;
module.exports.getComponentInstance = getComponentInstance;

// URL patterns below need to be handled by the site's index.js
module.exports.dateUrlPattern = urlPatterns.dateUrlPattern;
module.exports.articleSlugPattern = urlPatterns.articleSlugPattern;
module.exports.articleSecondarySectionFrontSlugPattern = urlPatterns.articleSecondarySectionFrontSlugPattern;
module.exports.authorPageSlugPattern = o => `${o.prefix}/${o.contentType}/${o.authorSlug}`;
module.exports.gallerySlugPattern = urlPatterns.gallerySlugPattern;
module.exports.gallerySecondarySectionFrontSlugPattern = urlPatterns.gallerySecondarySectionFrontSlugPattern;
module.exports.sectionFrontSlugPattern = urlPatterns.sectionFrontSlugPattern;
module.exports.secondarySectionFrontSlugPattern = urlPatterns.secondarySectionFrontSlugPattern;
module.exports.eventSlugPattern = urlPatterns.eventSlugPattern;

module.exports.PAGE_TYPES = PAGE_TYPES;

