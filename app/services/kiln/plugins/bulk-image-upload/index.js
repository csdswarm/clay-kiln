/**
 * Bulk Image Upload plugin.
 */

'use strict';

// Require depedencies.
const BulkImageUpload = require('./bulk-image-upload.vue');

// Register plugin.
module.exports = () => {

  window.kiln = window.kiln || {};
  window.kiln.inputs = window.kiln.inputs || {};
  window.kiln.inputs['bulk-image-upload'] = BulkImageUpload;

};
