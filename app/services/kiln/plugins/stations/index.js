'use strict';

const _set = require('lodash/set'),
  stationThemeButton = require('./station-theme-button.vue'),
  stationTheme = require('./station-theme.vue'),
  { DEFAULT_STATION } = require('../../../universal/constants');

module.exports = () => {
  const { stationForPermissions, user } = window.kiln.locals;

  if (
    stationForPermissions
    && stationForPermissions.id !== DEFAULT_STATION.id
    && user.can('update').a('station-theme').value
  ) {
    _set(window, "kiln.navButtons['station-theme']", stationThemeButton);
    _set(window, "kiln.navContent['station-theme']", stationTheme);
  }
};
