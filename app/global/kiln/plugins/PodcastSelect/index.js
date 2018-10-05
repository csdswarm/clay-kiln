/**
 * Autocomplete Dropdown Plugin
 */
 // Require depedencies.
const PodcastSelect = require('./podcast-select.vue')
 // Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['podcast-select'] = PodcastSelect;
};
