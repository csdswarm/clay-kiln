'use strict';

const pubUtils = require('./publish-utils');

function getUrlOptions(pageData, locals, mainComponentRefs) {
  const componentReference = pubUtils.getComponentReference(pageData, mainComponentRefs);

  if (!componentReference) {
    return Promise.reject(new Error('Could not find a main component on the page'));
  }

  return pubUtils.getMainComponentFromRef(componentReference, locals)
    .then(mainComponent => {
      return pubUtils.getUrlOptions(mainComponent, locals);
    });
}

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
      return pubUtils.articleSlugPattern(urlOptions);
    });
}

module.exports.getYearMonthSlugUrl = getYearMonthSlugUrl;
module.exports.getArticleSlugUrl = getArticleSlugUrl;
