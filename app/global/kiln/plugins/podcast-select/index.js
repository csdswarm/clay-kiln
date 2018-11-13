'use strict';

// Require depedencies.
const podcastSelect = require('./podcast-select.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['podcast-select'] = podcastSelect;
};
