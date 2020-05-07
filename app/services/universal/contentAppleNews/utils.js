'use strict';

/* eslint-disable one-var */

const { ANF_EMPTY_COMPONENT } = require('./constants');
const _isPlainObject = require('lodash/isPlainObject');

/**
 * Determines if the value is an empty anf component via duck typing. We can't just check by reference
 * equality because the value typically comes from an api call.
 *
 * @param {Any} val
 * @returns {Bool}
 */
module.exports.isEmptyComponent = (val) =>
  _isPlainObject(val) && val.text === ANF_EMPTY_COMPONENT.text;
