'use strict';

// Require depedencies.
const contentImport = require('./content-import.vue'),
  main = require('./main.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['content-import'] = contentImport;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['content-import'] = main;
};
