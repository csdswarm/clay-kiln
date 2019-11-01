'use strict';

// Require depedencies.
const selectList = require('./select-list.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['select-list'] = selectList;
};
