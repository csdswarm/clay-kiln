'use strict';

// Require depedencies.
const _set = require('lodash/set'),
  navButton = require('./nav-button.vue'),
  navContent = require('./nav-content.vue'),
  { unityAppDomainName: unityApp } = require('../../../universal/urps');

// Register plugin.
module.exports = () => {
  const { user } = window.kiln.locals;

  if (user.can('update').a('valid-script-source').for(unityApp).value) {
    _set(window, 'kiln.navButtons.valid-source', navButton);
    _set(window, 'kiln.navContent.valid-source', navContent);
  }
};
