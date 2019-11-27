'use strict';

// Require depedencies.
const alerts = require('./alerts.vue'),
  alertsMain = require('./alerts-main.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.locals = window.kiln.locals || {};
  window.kiln.navButtons = window.kiln.navButtons || {};


  const hasAlertsAccess = () => {
    const { stationsIHaveAccesTo, user } = window.kiln.locals;

    if (user && user.can && stationsIHaveAccesTo) {
      return user.can('create').an('alerts_global').value ||
        user.can('update').an('alerts_global').value ||
        Object.keys(stationsIHaveAccesTo).length;
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
