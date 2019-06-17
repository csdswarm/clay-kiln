'use strict';

// Require depedencies.
const stationSelect = require('./station-select.vue'),
  genreSelect = require('./genre-select.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['station-select'] = stationSelect;
  window.kiln.inputs['genre-select'] = genreSelect;
};
