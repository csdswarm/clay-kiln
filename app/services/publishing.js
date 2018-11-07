'use strict';

const urlPub = require('./server/publish-url');

/**
 * Adds lastModified to page object
 * @param {object} pageData
 * @returns {object}
 */
function addLastModified(pageData) {
  pageData.lastModified = Date.now();
  return pageData;
}

module.exports.getYearMonthSlugUrl = urlPub.getYearMonthSlugUrl;
module.exports.getArticleSlugUrl = urlPub.getArticleSlugUrl;
module.exports.addLastModified = addLastModified;
