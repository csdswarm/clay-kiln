'use strict';

// Require depedencies.
const podcastCategorySelect = require('./podcast-category-select.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['podcast-category-select'] = podcastCategorySelect;
};
