'use strict';

const _ = require('lodash'),
  { getComponentName } = require('clayutils');


/**
 * Given an array of component names, return a function
 * who can check redis operations for the presence of
 * one of the supplied components
 *
 * @param  {Array}  cmpts [description]
 * @return {Function}       [description]
 */
function isOpForComponents(cmpts) {
  if (!Array.isArray(cmpts)) {
    throw new Error('An Array was not provided');
  }

  return function (op) {
    return cmpts.indexOf(getComponentName(op.key)) !== -1;
  };
}

/**
 * Remove some `post` specific properties
 *
 * @param  {Object} op
 * @return {Object}
 */
function stripPostProperties(op) {
  op.value = _.omit(op.value, ['content']);

  return op;
}

module.exports.isOpForComponents = isOpForComponents;
module.exports.stripPostProperties = stripPostProperties;
