'use strict';

const toUpper = require('lodash/toUpper');

/**
 * Transform string to upper case
 *
 * @param  {String} text
 * @return {String}
 */

function toUpperCase(text) {
  return typeof text === 'string' ? toUpper(text) : text;
}

module.exports = toUpperCase;
