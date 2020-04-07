'use strict';

const getFromUrps = require('./get-from-urps'),
  { PERM_CHECK_INTERVAL } = require('./utils');

const getStationDomainNamesIHaveAccessTo = makeCachedUrpsCall({
    urlPath: '/domains/by-type',
    cachedPropName: 'stationDomainNamesIHaveAccessTo',
    toResult: stations => stations.map(aStation => aStation.name),
    urpsReqBody: { domainType: 'station' }
  }),
  getStationDomainNamesICanImportContent = makeCachedUrpsCall({
    urlPath: '/domains/by-type-and-permission',
    cachedPropName: 'stationDomainNamesICanImportContent',
    toResult: stations => stations.map(aStation => aStation.name),
    urpsReqBody: {
      domainType: 'station',
      action: 'import',
      // permissionCategory is the target as we think of it
      permissionCategory: 'content'
    }
  });

/**
 * returns a function which takes req.session.auth as a parameter and returns
 *   the results of the urps call - which is cached in session.
 *
 * also, because refresh-permissions needs to know the mapping from urlPath to
 *   the call being made, the function returned has the metaData attached as
 *   a property.
 *
 * @param {object} metaData
 * @param {string} metaData.cachedPropName - the property name which will hold the cached results and assigned to auth
 * @param {string} metaData.urlPath - the urps url path which we'll fetch the data from
 * @param {object} metaData.urpsReqBody - the request body sent to urps
 * @param {function} metaData.toResult - the function used to turn the response data into the cached result
 * @returns {function} - a function which takes the jwt and returns the station domain names.  It also optionally
 *   takes an 'isRefresh' option which refreshes the permissions if perm_check_interval hasn't passed yet.
 */
function makeCachedUrpsCall(metaData) {
  const { cachedPropName, toResult, urlPath, urpsReqBody } = metaData,
    cachedCall = async (auth, opts = {}) => {
      const { isRefresh } = opts,
        currentTime = Date.now(),
        { lastUpdatedByUrlPath = {} } = auth,
        lastUpdated = lastUpdatedByUrlPath[urlPath];

      if (
        !auth[cachedPropName]
        || !lastUpdated
        || lastUpdated + PERM_CHECK_INTERVAL < currentTime
        || isRefresh
      ) {
        const { data } = await getFromUrps(
          urlPath,
          urpsReqBody,
          auth.token
        );

        lastUpdatedByUrlPath[urlPath] = currentTime;

        Object.assign(auth, {
          [cachedPropName]: toResult(data),
          lastUpdatedByUrlPath
        });
      }

      return auth[cachedPropName];
    };

  return Object.assign(cachedCall, { metaData });
}

module.exports = {
  getStationDomainNamesICanImportContent,
  getStationDomainNamesIHaveAccessTo
};
