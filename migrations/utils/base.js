'use strict';
const YAML = require('../../app/node_modules/yamljs');

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'token accesskey',
};

/**
 * Ensures 'str' ends with 'suffix'
 *
 * This function is meant to be used in a mapper.  e.g.
 *
 * allUris = allUris.map(ensureEndsWith('@published'))
 *
 * @param {string} suffix - the string that should be at the end of 'str'
 * @returns {function}
 */
const ensureEndsWith = suffix => str => {
  return str.endsWith(suffix)
    ? str
    : str + suffix
};

// This library is designed to provide easy access to simple functions that have little to no
// dependencies on anything else. Anything here should be either a wrapper for a 3rd party method
// or a fairly simple, but common abstraction

// IMPORTANT: This file contains core dependencies
//            Do not add methods to this library that depend on any other items in this library
//            create a new module or add those directly to migration-utils.js
module.exports = {
  DEFAULT_HEADERS,
  _: require('../../app/node_modules/lodash'),
  _chunk: require('../../app/node_modules/lodash/chunk'),
  _defaults: require('../../app/node_modules/lodash/defaults'),
  _flatMap: require('../../app/node_modules/lodash/flatMap'),
  _get: require('../../app/node_modules/lodash/get'),
  _has: require('../../app/node_modules/lodash/has'),
  _identity: require('../../app/node_modules/lodash/identity'),
  _isEqual: require('../../app/node_modules/lodash/isEqual'),
  _set: require('../../app/node_modules/lodash/set'),
  _unset: require('../../app/node_modules/lodash/unset'),
  axios: require('../../app/node_modules/axios'),
  bluebird: require('../../app/node_modules/bluebird'),
  claycli: require('../../app/node_modules/claycli'),
  clayutils: require('../../app/node_modules/clayutils'),
  clone: obj => obj && JSON.parse(JSON.stringify(obj)),
  ensureEndsWith,
  prettyJSON: obj => JSON.stringify(obj, null, 2),
  toYaml: obj => YAML.stringify(obj, 8, 2),
  waitMs: ms => new Promise(resolve => {
    setTimeout(resolve, ms)
  }),
  yamljs: YAML,
};
