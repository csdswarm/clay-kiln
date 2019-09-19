'use strict';

const _set = require('lodash/set'),
  navContent = require('./nav-content.vue');

module.exports = () => {
  _set(window, 'kiln.navContent.new-page', navContent);
};
