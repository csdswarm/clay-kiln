'use strict';

const _ = require('lodash'),
  moment = require('moment'),
  db = require('./db'),
  sanitize = require('../universal/sanitize'),
  utils = require('../universal/utils'),
  log = require('../universal/log').setup({ file: __filename }),
  canonicalProtocol = 'http', // todo: this is a HUGE assumption, make it not be an assumption?
  canonicalPort = process.env.PORT || 3001,
  bluebird = require('bluebird'),
  rest = require('../../services/universal/rest'),
  slugifyService = require('../../services/universal/slugify'),
  pageTypes = {
    ARTICLE: 'article',
    GALLERY: 'gallery',
    SECTIONFRONT: 'section-front'
  },
  /**
   * returns a url to the server for a component
   *
   * @param {string} uri
   * @returns {string}
   */
  componentUri = (uri) => uri.replace(/([^/]+)(.*)/, `${canonicalProtocol}://$1:${canonicalPort}$2`),
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
  for (let key in page) {
    if (page.hasOwnProperty(key)) {
      let value = page[key];

      if (isMainComponentReference(value, mainComponentRefs)) {
        return value;
      } else if (_.isObject(value)) {
        let result = _.isArray(value) ? _.find(value, function (o) { return isMainComponentReference(o, mainComponentRefs); }) : getComponentReference(value, mainComponentRefs);
        
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

    if ([pageTypes.ARTICLE,pageTypes.GALLERY].includes(pageType)) {
      guaranteePrimaryHeadline(component);
      guaranteeLocalDate(component, publishedComponent, locals);
    }
    
    return {component, pageType};
  });
}

/**
 * Return the URL prefix of a site.
 * @param {object} site e.g. {prefix: 'localhost.thecut.com', port: 3001, proto: 'http'}
 * @returns {string} e.g. 'http://localhost.thecut.com:3001'
 */
function getUrlPrefix(site) {
  const proto = site && site.proto || canonicalProtocol,
    port = site && site.port || canonicalPort,
    urlPrefix = utils.uriToUrl(site.prefix, { site: { protocol: proto, port: port } });

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
  urlOptions.sectionFront = component.sectionFront || slugifyService(component.title);
  urlOptions.contentType = component.contentType || null;
  urlOptions.yyyy = date.format('YYYY') || null;
  urlOptions.mm = date.format('MM') || null;
  urlOptions.slug = component.title || component.slug || sanitize.cleanSlug(component.primaryHeadline) || null;
  urlOptions.isEvergreen = component.evergreenSlug || null;
  urlOptions.pageType = pageType;

  if ([pageTypes.ARTICLE, pageTypes.GALLERY].includes(urlOptions.pageType)) {
    if (!(locals.site && locals.date && urlOptions.slug)) {
      throw new Error('Client: Cannot generate a canonical url at prefix: ' +
        locals.site && locals.site.prefix + ' slug: ' + urlOptions.slug + ' date: ' + locals.date);
    }
  } else if (urlOptions.pageType === pageTypes.SECTIONFRONT) {
    if (!(locals.site && urlOptions.sectionFront)) {
      throw new Error('Client: Cannot generate a canonical url at prefix: ' +
        locals.site && locals.site.prefix + ' title: ' + urlOptions.sectionFront);
    }
  }
  return urlOptions;
}

module.exports.getComponentReference = getComponentReference;
module.exports.getMainComponentFromRef = getMainComponentFromRef;
module.exports.getUrlOptions = getUrlOptions;
module.exports.getUrlPrefix = getUrlPrefix;
module.exports.getPublishDate = getPublishDate;
// URL patterns below need to be handled by the site's index.js
module.exports.dateUrlPattern = o => `${o.prefix}/${o.sectionFront}/${o.slug}.html`; // e.g. http://vulture.com/music/x.html - modified re: ON-333
module.exports.articleSlugPattern = o => `${o.prefix}/${o.sectionFront}/${o.slug}`; // e.g. http://radio.com/music/eminem-drops-new-album-and-its-fire - modified re: ON-333
module.exports.gallerySlugPattern = o => `${o.prefix}/${o.sectionFront}/gallery/${o.slug}`; // e.g. http://radio.com/music/gallery/grammies
module.exports.sectionFrontSlugPattern = o => `${o.prefix}/${o.sectionFront}`; // e.g. http://radio.com/music
module.exports.putComponentInstance = putComponentInstance;
module.exports.pageTypes = pageTypes;
