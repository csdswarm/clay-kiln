'use strict';

const pubUtils = require('./publish-utils'),
  { pageTypes } = pubUtils;

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
    .then(({component, pageType}) => {
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
      return pubUtils.dateUrlPattern(urlOptions);
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
      if (urlOptions.contentType === pageTypes.ARTICLE) {
        if (urlOptions.secondarySectionFront) {
          return pubUtils.articleSecondarySectionFrontSlugPattern(urlOptions);
        }
        return pubUtils.articleSlugPattern(urlOptions);
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
      if (urlOptions.contentType === pageTypes.GALLERY) {
        if (urlOptions.secondarySectionFront) {
          return pubUtils.gallerySecondarySectionFrontSlugPattern(urlOptions);
        }
        return pubUtils.gallerySlugPattern(urlOptions);
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
      if (urlOptions.pageType === pageTypes.SECTIONFRONT) {
        if (!urlOptions.primarySectionFront) {
          return pubUtils.sectionFrontSlugPattern(urlOptions);
        } else {
          return pubUtils.secondarySectionFrontSlugPattern(urlOptions);
        }
      }
    });
}

function getAuthorPageUrl(pageData, locals, mainComponentRefs) {
  return getUrlOptions(pageData, locals, mainComponentRefs)
    .then(urlOptions => {
      const slug = pubUtils.authorPageSlugPattern(urlOptions);
      
      return slug;
    });
}

module.exports.getYearMonthSlugUrl = getYearMonthSlugUrl;
module.exports.getArticleSlugUrl = getArticleSlugUrl;
module.exports.getGallerySlugUrl = getGallerySlugUrl;
module.exports.getSectionFrontSlugUrl = getSectionFrontSlugUrl;
module.exports.getAuthorPageUrl = getAuthorPageUrl;
