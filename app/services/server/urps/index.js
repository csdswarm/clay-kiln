'use strict';

const cachedCalls = require('./cached-calls');

module.exports = {
  getDomainNamesICanImportContent: cachedCalls.getDomainNamesICanImportContent,
  getDomainNamesIHaveAccessTo: cachedCalls.getDomainNamesIHaveAccessTo,
  loadStationPermissions: require('./load-station-permissions'),
  refreshPermissions: require('./refresh-permissions'),
  updateAuthData: require('./update-auth-data')
};
