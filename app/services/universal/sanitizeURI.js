'use strict';

const
  /**
   * Check if a string is encoded by comparing it to the decoded version
   *
   * @param {string} text
   * @return {bool}
   */
  isEncoded = (text) => decodeURI(text) !== text,

  /**
   * Expose encodeURI to handlebars templates, and try to avoid double encoding
   *
   * @param {string} text the string
   * @returns {string} The encodeURI version of the string
   */
  sanitizeURI = (text) => isEncoded(text) ? text : encodeURI(text);

module.exports = sanitizeURI;
