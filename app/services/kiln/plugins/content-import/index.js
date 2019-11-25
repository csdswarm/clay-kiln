'use strict';

// Require depedencies.
const contentImport = require('./content-import.vue'),
  main = require('./main.vue'),
  addPermissions = require('../../../universal/user-permissions');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navContent = window.kiln.navContent || {};

  addPermissions(window.kiln.locals);
  if (window.kiln.locals.user.can('import').using('import-content').value) {
    window.kiln.navButtons['content-import'] = contentImport;
    window.kiln.navContent['content-import'] = main;
  }
};

