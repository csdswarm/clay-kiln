'use strict';

/**
 * Expose encodeURI to handlebars templates
 *
 * @param {String} text the string
 * @returns {String} The encodeURI version of the string
 */
const encodeURIHelper = (text) => encodeURI(text);

module.exports = encodeURIHelper;
