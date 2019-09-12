'use strict';

const _get = require('lodash/get'),
  api = {};

/**
 * README
 *  - This file is meant to hold utilities that help query and/or manipulate
 *    the dom.
 */

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
 * A curried function which returns whether the element has the content
 *
 * @param {string} textContent
 * @returns {function}
 * @example
 *   Array.from(document.querySelectorAll('button'))
 *     .find(hasContent('New Page'))
 */
api.hasTextContent = textContent => element => {
  return element && element.textContent === textContent;
};

module.exports = api;
