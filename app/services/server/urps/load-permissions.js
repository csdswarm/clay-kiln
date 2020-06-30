'use strict';

const getPermissions = require('./get-permissions');

/**
 * loads the permissions for each domain name in stationDomainNames
 *
 * @param {object} auth - req.session.auth.  This value is mutated
 * @param {string[]} stationDomainNames
 */
module.exports = async (auth, stationDomainNames) => {
  const { lastUpdatedByStationDomainName = {} } = auth,
    currentTime = Date.now(),
    updatedPermissions = await getPermissions(auth.token, stationDomainNames);

  for (const domainName of stationDomainNames) {
    lastUpdatedByStationDomainName[domainName] = currentTime;
  }

  Object.assign(auth, {
    lastUpdatedByStationDomainName,
    permissions: Object.assign(auth.permissions || {}, updatedPermissions)
  });
};
