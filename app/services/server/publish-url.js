'use strict';

const pubUtils = require('./publish-utils'),
  urlPatterns = require('../universal/url-patterns'),
  { PAGE_TYPES } = pubUtils;

/**
 * Common functionality used for `getYearMonthSlugUrl` and `getArticleSlugUrl`
 *
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise} returns an object to be consumed by url patterns.
 */
function getUrlOptions(pageData, locals, mainComponentRefs) {
  const componentReference = pubUtils.getComponentReference(pageData, mainComponentRefs);

  if (!componentReference) {
    return Promise.reject(new Error('Could not find a main component on the page'));
  }

  return pubUtils.getMainComponentFromRef(componentReference, locals)
    .then(({ component, pageType }) => {
      return pubUtils.getUrlOptions(component, locals, pageType);
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

module.exports = {
  getYearMonthSlugUrl,
  getArticleSlugUrl,
  getGallerySlugUrl,
  getSectionFrontSlugUrl,
  getAuthorPageSlugUrl,
  getContestSlugUrl,
  getStationFrontSlugUrl
};
