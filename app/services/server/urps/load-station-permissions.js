'use strict';

const loadPermissions = require('./load-permissions'),
  log = require('../../universal/log').setup({ file: __filename }),
  { getStationDomainName, getStationDomain } = require('../../universal/urps'),
  { PERM_CHECK_INTERVAL } = require('./utils');

/**
 * loads the permissions for both 'Unity App' and whatever station was
 *   determined for permissions.
 *
 * @param {Object} session - user session object
 * @param {Object} locals - locals
 * @returns {Promise<void>}
 */
module.exports = async (session, locals) => {
  try {
    const currentTime = Date.now(),
      { auth } = session,
      { permissions = {} } = auth,
      // we don't need to keep track of last updated by unityAppDomainName
      //   because it will always be requested alongside the station's
      //   permissions,meaning it will always be up to date within
      //   the PERM_CHECK_INTERVAL.
      { lastUpdatedByStationDomainName = {} } = auth,
      { stationForPermissions } = locals,
      stationDomainName = getStationDomainName(stationForPermissions),
      lastUpdated = lastUpdatedByStationDomainName[stationDomainName];

    if (
      !permissions[stationDomainName]
      || !lastUpdated
      || lastUpdated + PERM_CHECK_INTERVAL < currentTime
    ) {
      const stationDomain = getStationDomain(stationForPermissions);

      await loadPermissions(auth, [stationDomain]);
    }

  } catch (error) {
    log('error', `There was an error attempting to load user permissions for ${locals.user.username}.`, error);
  }
};
