'use strict';

// Require depedencies.
const alerts = require('./alerts.vue'),
  alertsMain = require('./alerts-main.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['alerts'] = alerts;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['alerts'] = alertsMain;
};
