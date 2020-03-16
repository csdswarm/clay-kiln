'use strict';

// Require depedencies.
const _set = require('lodash/set'),
  contentImport = require('./content-import.vue'),
  main = require('./main.vue');

// Register plugin.
module.exports = () => {
  const { stationsICanImportContent } = window.kiln.locals;

  if (Object.keys(stationsICanImportContent).length) {
    _set(window, 'kiln.navButtons.content-import', contentImport);
    _set(window, 'kiln.navContent.content-import', main);
  }
};

