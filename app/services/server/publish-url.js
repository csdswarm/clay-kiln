'use strict';

const pubUtils = require('./publish-utils');

/**
 * Return the url for a page based on its main component's date or throw if no date.
 * @param {object} pageData
 * @param {object} locals
 * @param {object} mainComponentRefs
 * @returns {Promise}
 */
function getYearMonthSlugUrl(pageData, locals, mainComponentRefs) {
  const componentReference = pubUtils.getComponentReference(pageData, mainComponentRefs);

  if (!componentReference) {
    return Promise.reject(new Error('Could not find a main component on the page'));
  }

  return pubUtils.getMainComponentFromRef(componentReference, locals)
    .then(mainComponent => {
      let urlOptions = pubUtils.getUrlOptions(mainComponent, locals);

      return pubUtils.dateUrlPattern(urlOptions);
    });
}

module.exports.getYearMonthSlugUrl = getYearMonthSlugUrl;
