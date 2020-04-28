'use strict';

// Require depedencies.
const editorialManagementContent = require('./editorial-mgmt-main.vue'),
  editorialManagement = require('./editorial-mgmt.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['editorial-mgmt'] = editorialManagement;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['editorial-mgmt'] = editorialManagementContent;
};
