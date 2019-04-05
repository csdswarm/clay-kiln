'use strict';
const _kebabCase = require('lodash/kebabCase');

/**
 * Transform string into slug
 *
 * @param  {String} string
 * @return {String}
 */
function slugify(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return _kebabCase(string);
}

module.exports = slugify;
