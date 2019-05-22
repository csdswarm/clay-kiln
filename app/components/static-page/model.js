'use strict';

const createContent = require('../../services/universal/create-content');

/**
 * Handles pre-save operations for Static Pages
 * @param {string} uri
 * @param {Object} data
 * @param {Object} locals
 * @returns {Object}
 */
module.exports.save = function (uri, data, locals) {
  if (!data.pageTitle) {
    data.pageTitle = data.headline;
  }

  Object.assign(data, {
    shortHeadline: data.pageTitle,
    primaryHeadline: data.pageTitle
  });

  return createContent.save(uri, data, locals);
};
