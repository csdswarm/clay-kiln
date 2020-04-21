'use strict';

const cachedCalls = require('./cached-calls');

module.exports = {
  getStationDomainNamesICanImportContent: cachedCalls.getStationDomainNamesICanImportContent,
  getStationDomainNamesIHaveAccessTo: cachedCalls.getStationDomainNamesIHaveAccessTo,
  loadStationPermissions: require('./load-station-permissions'),
  refreshPermissions: require('./refresh-permissions'),
  updateAuthData: require('./update-auth-data')
};
