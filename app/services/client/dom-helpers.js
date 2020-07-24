'use strict';

/**
 * README
 *  - This file is meant to hold utilities that help query and/or manipulate
 *    the dom.
 */

const _get = require('lodash/get'),
  api = {};

/**
 * A curried function which returns whether the element has the class
 *
 * @param {string} className
 * @returns {function}
 * @example
 *   Array.from(document.querySelectorAll('button'))
 *     .find(hasClass('publish'))
 */
api.hasClass = className => element => {
  const classList =  _get(element, 'classList');

  return classList && classList.contains(className);
};

/**
 * A function which returns a string with first char capitalized
 *
 * @param {string} str
 * @returns {string}
 * @example
 *   capitalize('foo') // Foo
 */
api.capitalize = (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

module.exports = api;
