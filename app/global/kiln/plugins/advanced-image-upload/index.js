/**
 * Advanced Image Upload plugin.
 */

// Require depedencies.
const AdvancedImageUpload = require('./advanced-image-upload.vue')

// Register plugin.
module.exports = () => {

  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['advanced-image-upload'] = AdvancedImageUpload;

};
