'use strict';

const getPermissions = require('./get-permissions');

/**
 * loads the permissions for each domain name in stationDomainNames
 *
 * @param {object} auth - req.session.auth.  This value is mutated
 * @param {Array} stationDomainNames
 */
module.exports = async (auth, stationDomainNames) => {
  const { lastUpdatedByStationDomainName = {} } = auth,
    currentTime = Date.now(),
    updatedPermissions = await getPermissions(auth.idToken, stationDomainNames);

  for (const domainName of stationDomainNames) {
    // TODO: this should be revisited since all the information is been generated in the URPS Side.
    //  just addinng this line to keep track of this.
    if (typeof domainName === 'string') {
      lastUpdatedByStationDomainName[domainName] = currentTime;
    } else {
      const domain = `${domainName.type} - ${domainName.id}`;

      lastUpdatedByStationDomainName[domain] = currentTime;
    }
  }

  Object.assign(auth, {
    lastUpdatedByStationDomainName,
    permissions: Object.assign(auth.permissions || {}, updatedPermissions)
  });
};
