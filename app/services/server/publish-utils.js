'use strict';

const _ = require('lodash'),
  moment = require('moment'),
  db = require('./db'),
  sanitize = require('../universal/sanitize'),
  utils = require('../universal/utils'),
  log = require('../universal/log').setup({ file: __filename }),
  canonicalProtocol = 'http', // todo: this is a HUGE assumption, make it not be an assumption?
  canonicalPort = process.env.PORT || 3001,
  bluebird = require('bluebird');

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
    guaranteePrimaryHeadline(component);
    guaranteeLocalDate(component, publishedComponent, locals);
    return component;
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
 * @returns {{prefix: string, sectionFront: string, contentType: string, yyyy: string, mm: string, slug: string, isEvergreen: boolean}}
 * @throws {Error} if there's no date, slug, or prefix
 */
function getUrlOptions(component, locals) {
  const urlOptions = {},
    date = moment(locals.date);

  urlOptions.prefix = getUrlPrefix(locals.site);
  urlOptions.sectionFront = component.sectionFront;
  urlOptions.contentType = component.contentType;
  urlOptions.yyyy = date.format('YYYY');
  urlOptions.mm = date.format('MM');
  urlOptions.slug = component.slug || sanitize.cleanSlug(component.primaryHeadline);
  urlOptions.isEvergreen = component.evergreenSlug;

  if (!(locals.site && locals.date && urlOptions.slug)) {
    throw new Error('Client: Cannot generate a canonical url at prefix: ' +
      locals.site && locals.site.prefix + ' slug: ' + urlOptions.slug + ' date: ' + locals.date);
  }

  return urlOptions;
}

module.exports.getComponentReference = getComponentReference;
module.exports.getMainComponentFromRef = getMainComponentFromRef;
module.exports.getUrlOptions = getUrlOptions;
module.exports.getUrlPrefix = getUrlPrefix;
module.exports.getPublishDate = getPublishDate;
// URL patterns below need to be handled by the site's index.js
module.exports.dateUrlPattern = o => `${o.prefix}/${o.yyyy}/${o.mm}/${o.slug}.html`; // e.g. http://vulture.com/2016/04/x.html
module.exports.articleSlugPattern = o => `${o.prefix}/${o.sectionFront}/article/${o.slug}`; // e.g. http://radio.com/music/article/eminem-drops-new-album-and-its-fire
module.exports.gallerySlugPattern = o => `${o.prefix}/${o.sectionFront}/gallery/${o.slug}`; // e.g. http://radio.com/music/gallery/grammies
