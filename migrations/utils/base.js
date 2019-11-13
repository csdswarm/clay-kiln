'use strict';
const YAML = require('../../app/node_modules/yamljs');

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'token accesskey',
};

// This library is designed to provide easy access to simple functions that have little to no
// dependencies on anything else. Anything here should be either a wrapper for a 3rd party method
// or a fairly simple, but common abstraction

// IMPORTANT: This file contains core dependencies
//            Do not add methods to this library that depend on any other items in this library
//            create a new module or add those directly to migration-utils.js
module.exports = {
  DEFAULT_HEADERS,
  _chunk: require('../../app/node_modules/lodash/chunk'),
  _defaults: require('../../app/node_modules/lodash/defaults'),
  _get: require('../../app/node_modules/lodash/get'),
  _has: require('../../app/node_modules/lodash/has'),
  _identity: require('../../app/node_modules/lodash/identity'),
  _set: require('../../app/node_modules/lodash/set'),
  _unset: require('../../app/node_modules/lodash/unset'),
  claycli: require('../../app/node_modules/claycli'),
  clone: obj => obj && JSON.parse(JSON.stringify(obj)),
  prettyJSON: obj => JSON.stringify(obj, null, 2),
  toYaml: obj => YAML.stringify(obj, 8, 2),
};
