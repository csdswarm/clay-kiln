'use strict';

/**
 * README
 *  - This file is meant to hold utilities that help query and/or manipulate
 *    the dom.
 */

const _get = require('lodash/get'),
  isTruthy = require('lodash/identity'),
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
 * sets all truthy elements to have the style display: none
 *
 * @param {Element[] | NodeList} elements
 */
api.setEachToDisplayNone = elements => {
  Array.from(elements).filter(isTruthy)
    .forEach(anElement => {
      anElement.style.display = 'none';
    });
};

module.exports = api;
