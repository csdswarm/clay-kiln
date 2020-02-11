/**
 * Advanced Image Upload plugin.
 */

'use strict';

// Require depedencies.
const AdvancedImageUpload = require('./advanced-image-upload.vue'),
  _set = require('lodash/set');

// Register plugin.
module.exports = () => {
  _set(window, 'kiln.inputs.advanced-image-upload', AdvancedImageUpload);
};
