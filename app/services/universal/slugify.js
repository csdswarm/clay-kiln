'use strict';
const _ = require('lodash');

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

  return _.kebabCase(string);
}

module.exports = slugify;
