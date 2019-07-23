'use strict';
const slugifyService = require('../../services/universal/slugify'),
  { toPlainText } = require('../../services/universal/sanitize');

/**
 *
 * @param {string} uri
 * @param {Object} data
 * @param {Object} locals
 * @returns {{text:string, anchorId:string}}
 */
module.exports.save = (uri, data) => {
  if (data.text) {
    data.anchorId = 'ip-' + slugifyService(toPlainText(data.text));
  }
  return data;
};
