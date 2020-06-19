'use strict';

const cachedCalls = require('./cached-calls');

module.exports = Object.assign(
  {},
  cachedCalls,
  {
    loadStationPermissions: require('./load-station-permissions'),
    refreshPermissions: require('./refresh-permissions'),
    updateAuthData: require('./update-auth-data')
  }
);
