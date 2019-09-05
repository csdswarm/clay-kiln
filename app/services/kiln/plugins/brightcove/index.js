'use strict';

// Require dependencies.
const brightcoveSearch = require('./brightcove-search.vue'),
  brightcoveUpload = require('./brightcove-upload.vue'),
  brightcoveUpdate = require('./brightcove-update.vue'),
  brightcovePlayer = require('./brightcove-player.vue'),
  brightcoveAdConfig = require('./brightcove-adconfig.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['brightcove-search'] = brightcoveSearch;
  window.kiln.inputs['brightcove-upload'] = brightcoveUpload;
  window.kiln.inputs['brightcove-update'] = brightcoveUpdate;
  window.kiln.inputs['brightcove-player'] = brightcovePlayer;
  window.kiln.inputs['brightcove-adconfig'] = brightcoveAdConfig;
};
