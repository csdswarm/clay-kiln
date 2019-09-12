'use strict';

const _set = require('lodash/set'),
  button = require('./button.vue'),
  drawerContent = require('./drawer-content.vue');

require('./remove-new-page-button');

// Register plugin.
module.exports = () => {
  _set(window, 'kiln.navButtons.newPageOverride', button);
  _set(window.kiln, 'navContent.newPageOverride', drawerContent);
};
