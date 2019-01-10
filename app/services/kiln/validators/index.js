'use strict';

module.exports = () => {
  window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
  window.kiln.validators = window.kiln.validators || {}; // create global validators if they don't exist
  window.kiln.validators['at-bottom'] = require('./at-bottom');
  window.kiln.validators['component-pairs'] = require('./component-pairs');
  window.kiln.validators['component-string-pairs'] = require('./component-string-pairs');
  window.kiln.validators['max-instances'] = require('./max-instances');
  window.kiln.validators['one-required'] = require('./one-required');
  window.kiln.validators['renditions'] = require('./renditions');
  window.kiln.validators['unique-url'] = require('./unique-url');
  window.kiln.validators['component-list-length'] = require('./component-list-length');
  window.kiln.validators['subscription-plans-selection'] = require('./only-one-required');
  window.kiln.validators['google-standout'] = require('./google-standout');
};
