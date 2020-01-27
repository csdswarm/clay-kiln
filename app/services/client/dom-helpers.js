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

module.exports = api;
