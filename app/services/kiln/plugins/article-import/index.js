'use strict';

// Require depedencies.
const articleImport = require('./article-import.vue'),
  main = require('./main.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['article-import'] = articleImport;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['article-import'] = main;
};
