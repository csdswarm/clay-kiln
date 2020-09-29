'use strict';

const pubUtils = require('./publish-utils'),
  urlPatterns = require('../universal/url-patterns'),

  { PAGE_TYPES } = pubUtils,

  __ = {
    pubUtils
  };

/**
 * Common functionality used for `getYearMonthSlugUrl` and `getArticleSlugUrl`
 *
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise} returns an object to be consumed by url patterns.
 */
function getUrlOptions(pageData, locals, mainComponentRefs) {
  const { getComponentReference, getMainComponentFromRef, getUrlOptions } = __.pubUtils,
    componentReference = getComponentReference(pageData, mainComponentRefs);

  if (!componentReference) {
    return Promise.reject(new Error('Could not find a main component on the page'));
  }

  return getMainComponentFromRef(componentReference, locals)
    .then(({ component, pageType }) => {
      return getUrlOptions(component, locals, pageType);
    });
}

/**
 * Return the url for a page based off its year/month of publishing.
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getYearMonthSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      return urlPatterns.date(urlOptions);
    });
}

/**
 * Return the url for a page based entirely on its slug, within the articles subdirectory
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getArticleSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.contentType === PAGE_TYPES.ARTICLE) {
        return urlPatterns.article(urlOptions);
      }
    });
}

/**
 * Return the url for a page based entirely on its slug, within the gallery subdirectory
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getGallerySlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.contentType === PAGE_TYPES.GALLERY) {
        return urlPatterns.gallery(urlOptions);
      }
    });
}

/**
 * Return the url for a section front based on its primary title
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getSectionFrontSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.SECTIONFRONT) {
        return urlPatterns.sectionFront(urlOptions);
      }
    });
}

/**
 * Return the url for an author page
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getAuthorPageSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.AUTHOR) {
        return urlPatterns.author(urlOptions);
      }
    });
}

/**
 * Return the url for a station front based on its station slug
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getStationFrontSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.STATIONFRONT) {
        return urlPatterns.stationFront(urlOptions);
      }
    });
}
/**
 * Return the url for a static page slug
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
async function getStaticPageSlugUrl(pageData, locals, mainComponentRefs) {
  const urlOptions = await getUrlOptions(pageData, locals, mainComponentRefs);

  if (urlOptions.pageType === PAGE_TYPES.STATIC_PAGES) {
    return urlPatterns.staticPage(urlOptions);
  }
}

/**
 * Return the url for a event pg based on its slug, within the events subdir
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getEventSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.EVENT) {
        return urlPatterns.event(urlOptions);
      }
    });
}

/**
 * Return the url for a contest pg based on its slug, within the contests subdir
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getContestSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.CONTEST) {
        return urlPatterns.contest(urlOptions);
      }
    });
}

/**
 * Return the url for a event pg based on its slug, within the events subdir
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getEventsListingUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.EVENTSLISTING) {
        return urlPatterns.eventsListing(urlOptions);
      }
    });
};

/**
 * Return the url for a podcast front based on its station site slug
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getPodcastFrontSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.PODCASTFRONT) {
        return urlPatterns.podcastFront(urlOptions);
      }
    });
}

/**
 * Return the url for a host page
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getHostPageSlugUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      if (urlOptions.pageType === PAGE_TYPES.HOST) {
        return urlPatterns.host(urlOptions);
      }
    });
}

module.exports = {
  _internals: __,
  getYearMonthSlugUrl,
  getArticleSlugUrl,
  getGallerySlugUrl,
  getSectionFrontSlugUrl,
  getAuthorPageSlugUrl,
  getEventSlugUrl,
  getEventsListingUrl,
  getContestSlugUrl,
  getStationFrontSlugUrl,
  getStaticPageSlugUrl,
  getHostPageSlugUrl,
  getPodcastFrontSlugUrl
};
