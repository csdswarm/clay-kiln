'use strict';

/**
 * Remove eot characters from the input text
 *
 * @param {string} text
 * @returns {string}
 */
module.exports = function stripEot(text = '') {
  return text.replace('\u0004', '');
};

