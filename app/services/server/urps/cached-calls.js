'use strict';

const getFromUrps = require('./get-from-urps'),
  { PERM_CHECK_INTERVAL } = require('./utils');

// these are slight misnomers as it's only stations and markets, but I can't
//   think of a good term to encompass both and the var names are already
//   too long.
//
// also unfortunately we need the markets only for National (which we're using
//   to represent RDC content).  We don't have an endpoint to get this
//   information for a single domain and URPS is slammed at the moment with work
//   so asking them to add another endpoint is unreasonable.
const getDomainNamesIHaveAccessTo = makeCachedUrpsCall({
    urlPath: '/domains/by-type',
    cachedPropName: 'domainNamesIHaveAccessTo',
    toResult: domains => domains.map(aDomain => aDomain.name)
  }),
  getDomainNamesICanImportContent = makeCachedUrpsCall({
    urlPath: '/domains/by-type-and-permission',
    cachedPropName: 'domainNamesICanImportContent',
    toResult: domains => domains.map(aDomain => aDomain.name),
    urpsReqBody: {
      action: 'import',
      // permissionCategory is the target as we think of it
      permissionCategory: 'content'
    }
  }),
  // the following are a short term solution until we can either
  //   1. figure out a good interface with urps to accomplish the same goal, or
  //   2. change our UX so we don't need permissions from various domains on
  //      every page
  //
  // the problem is that we need to filter the page templates based off user
  //   permissions for each station.  Right now the endpoint allows us to get
  //   the domains by a single permission, where we need urps to take multiple
  getDomainNamesICanCreateSectionFronts = makeCachedUrpsCall({
    urlPath: '/domains/by-type-and-permission',
    cachedPropName: 'domainNamesICanCreateSectionFronts',
    toResult: domains => domains.map(aDomain => aDomain.name),
    urpsReqBody: {
      action: 'create',
      // permissionCategory is the target as we think of it
      permissionCategory: 'section-front'
    }
  }),
  getDomainNamesICanCreateStaticPages = makeCachedUrpsCall({
    urlPath: '/domains/by-type-and-permission',
    cachedPropName: 'domainNamesICanCreateStaticPages',
    toResult: domains => domains.map(aDomain => aDomain.name),
    urpsReqBody: {
      action: 'create',
      // permissionCategory is the target as we think of it
      permissionCategory: 'static-page'
    }
  }),
  getDomainNamesICanCreateStationFronts = makeCachedUrpsCall({
    urlPath: '/domains/by-type-and-permission',
    cachedPropName: 'domainNamesICanCreateStationFronts',
    toResult: domains => domains.map(aDomain => aDomain.name),
    urpsReqBody: {
      action: 'create',
      // permissionCategory is the target as we think of it
      permissionCategory: 'station-front'
    }
  });

/**
 * returns a function which takes req.session.auth as a parameter and returns
 *   the results of the urps call - which is cached in session.
 *
 * also, because refresh-permissions needs to know the mapping from
 *   cachedPropName to the call being made, the function returned has the
 *   metaData attached as a property.
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
  const { cachedPropName, toResult, urlPath, urpsReqBody = {} } = metaData,
    cachedCall = async (auth, opts = {}) => {
      const { isRefresh } = opts,
        currentTime = Date.now(),
        { lastUpdatedByCachedPropName = {} } = auth,
        lastUpdated = lastUpdatedByCachedPropName[cachedPropName];

      if (
        !auth[cachedPropName]
        || !lastUpdated
        || lastUpdated + PERM_CHECK_INTERVAL < currentTime
        || isRefresh
      ) {
        const [{ data: stations }, { data: markets }] = await Promise.all([
          getFromUrps(
            urlPath,
            Object.assign({ domainType: 'station' }, urpsReqBody),
            auth.token
          ),
          getFromUrps(
            urlPath,
            Object.assign({ domainType: 'market' }, urpsReqBody),
            auth.token
          )
        ]);

        lastUpdatedByCachedPropName[cachedPropName] = currentTime;

        Object.assign(auth, {
          [cachedPropName]: toResult(stations.concat(markets)),
          lastUpdatedByCachedPropName
        });
      }

      return auth[cachedPropName];
    };

  return Object.assign(cachedCall, { metaData });
}

module.exports = {
  getDomainNamesICanCreateSectionFronts,
  getDomainNamesICanCreateStaticPages,
  getDomainNamesICanCreateStationFronts,
  getDomainNamesICanImportContent,
  getDomainNamesIHaveAccessTo
};
