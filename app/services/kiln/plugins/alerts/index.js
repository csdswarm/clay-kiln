'use strict';

// Require depedencies.
const alerts = require('./alerts.vue'),
  alertsMain = require('./alerts-main.vue'),
  { anyStation } = require('../../../universal/user-permissions');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.locals = window.kiln.locals || {};
  window.kiln.navButtons = window.kiln.navButtons || {};

  const user = window.kiln.locals.user,
    hasAlertsAccess = () => {
      if (user && user.can) {
        return user.can('create').an('alerts_global').for(anyStation).value ||
          user.can('update').an('alerts_global').for(anyStation).value;
      }

      return false;
    };

  // Don't register if the user doesn't have permission
  if (hasAlertsAccess()) {
    window.kiln.navButtons['alerts'] = alerts;
    window.kiln.navContent = window.kiln.navContent || {};
    window.kiln.navContent['alerts'] = alertsMain;
  }
};
