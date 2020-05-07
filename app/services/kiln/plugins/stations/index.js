'use strict';

// Require depedencies.
const stationThemeButton = require('./station-theme-button.vue'),
  stationTheme = require('./station-theme.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navContent = window.kiln.navContent || {};

  if (window.kiln.locals.station.id !== 0) {
    window.kiln.navButtons['station-theme'] = stationThemeButton;
    window.kiln.navContent['station-theme'] = stationTheme;
  }
};
