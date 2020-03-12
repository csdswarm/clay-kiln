'use strict';

const _set = require('lodash/set'),
  alerts = require('./alerts.vue'),
  alertsMain = require('./alerts-main.vue'),
  { unityAppDomainName: unityApp } = require('../../../universal/urps'),
  addPermissions = require('../../../universal/user-permissions');

function hasAlertsAccess() {
  const { locals } = window.kiln,
    { stationsIHaveAccessTo, user } = locals;

  addPermissions(locals);

  return user.can('create').a('global-alert').for(unityApp).value
    || user.can('update').a('global-alert').for(unityApp).value
    || Object.keys(stationsIHaveAccessTo || {}).length;
}

module.exports = () => {
  // Don't register if the user doesn't have permission
  if (hasAlertsAccess()) {
    _set(window, 'kiln.navButtons.alerts', alerts);
    _set(window.kiln, 'navContent.alerts', alertsMain);
  }
};
