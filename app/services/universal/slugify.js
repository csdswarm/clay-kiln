'use strict';
const _kebabCase = require('lodash/kebabCase');

/**
 * Transform string into slug
 *
 * @param  {String} text
 * @return {String}
 */
function slugify(text) {
  return typeof text === 'string' ? _kebabCase(text) : text;
}

module.exports = slugify;
