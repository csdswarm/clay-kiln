'use strict';

// Require depedencies.
const alerts = require('./alerts.vue'),
  alertsMain = require('./alerts-main.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.locals = window.kiln.locals || {};
  window.kiln.locals.permissions = window.kiln.locals.permissions || {};
  window.kiln.navButtons = window.kiln.navButtons || {};

  // Don't register if the user doesn't have permission
  if (window.kiln.locals.permissions.alerts_global || window.kiln.locals.permissions.alerts_station) {
    window.kiln.navButtons['alerts'] = alerts;
    window.kiln.navContent = window.kiln.navContent || {};
    window.kiln.navContent['alerts'] = alertsMain;
  }
};
