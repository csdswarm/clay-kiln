'use strict';

const _set = require('lodash/set'),
  allPageOverride = require('./all-page-override.vue'),
  myPageOverride = require('./my-page-override.vue');

module.exports = () => {
  _set(window, 'kiln.navContent.all-pages', allPageOverride);
  _set(window, 'kiln.navContent.my-pages', myPageOverride);
};
