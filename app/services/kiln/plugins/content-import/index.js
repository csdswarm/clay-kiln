'use strict';

// Require depedencies.
const _set = require('lodash/set'),
  contentImport = require('./content-import.vue'),
  main = require('./main.vue'),
  addPermissions = require('../../../universal/user-permissions'),
  { anyStation } = addPermissions;

// Register plugin.
module.exports = () => {
  const { user } = window.kiln.locals;

  addPermissions(window.kiln.locals);

  if (user.can('import').using('import-content').at(anyStation).value) {
    _set(window, 'kiln.navButtons.content-import', contentImport);
    _set(window, 'kiln.navContent.content-import', main);
  }
};

