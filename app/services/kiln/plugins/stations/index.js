'use strict';

const _set = require('lodash/set'),
  stationSettingsButton = require('./station-settings-button.vue'),
  stationSettingsManager = require('./station-settings-manager.vue'),
  { DEFAULT_STATION } = require('../../../universal/constants');

module.exports = () => {
  const { stationForPermissions, user } = window.kiln.locals;

  if (
    stationForPermissions
    && stationForPermissions.id !== DEFAULT_STATION.id
    && user.can('update').a('station-settings').value
  ) {
    _set(window, "kiln.navButtons['station-settings-manager']", stationSettingsButton);
    _set(window, "kiln.navContent['station-settings-manager']", stationSettingsManager);
  }
};
