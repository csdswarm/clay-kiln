'use strict';

// Require depedencies.
const navButton = require('./nav-button.vue'),
  navContent = require('./nav-content.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['valid-source'] = navButton;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['valid-source'] = navContent;
};
