'use strict';

// Require dependencies.
const contentSearch = require('./content-search.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['content-search'] = contentSearch;
};
