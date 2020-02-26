'use strict';

/**
 * Expose encodeURI to handlebars templates
 *
 * @param {String} text the string
 * @returns {String} The encodURI version of the string
 */
const encodeURIHelper = (text) => {
  return encodeURI(text);
};

module.exports = encodeURIHelper;
