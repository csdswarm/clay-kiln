'use strict';

// Require depedencies.
const brightcoveSearch = require('./brightcove-search.vue'),
  brightcoveUpload = require('./brightcove-upload.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['brightcove-search'] = brightcoveSearch;
  window.kiln.inputs['brightcove-upload'] = brightcoveUpload;
};
