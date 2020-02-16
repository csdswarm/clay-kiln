'use strict';

const _reduce = require('lodash/reduce'),
  _omitBy = require('lodash/omitBy'),
  _set = require('lodash/set'),
  cachedCalls = require('./cached-calls'),
  loadPermissions = require('./load-permissions'),
  { PERM_CHECK_INTERVAL } = require('./utils');

/**
 * returns a predicate which determines whether the lastUpdated time has passed
 *   expiration (as determined by PERM_CHECK_INTERVAL)
 *
 * @param {Date} currentTime
 * @returns {function}
 */
function makeIsExpired(currentTime) {
  return lastUpdated => {
    return lastUpdated + PERM_CHECK_INTERVAL < currentTime;
  };
}

async function refreshPermissionsByDomain(auth) {
  const currentTime = Date.now(),
    isExpired = makeIsExpired(currentTime),
    stationDomainNames = Object.keys(_omitBy(
      auth.lastUpdatedByStationDomainName,
      isExpired
    ));

  await loadPermissions(auth, stationDomainNames);
}

/**
 * a reducer which turns cachedCalls into a mapping of urlPath -> the call
 *   function and the cachedPropName
 *
 * @param {object} res - result
 * @param {function} callFn - the actual function to call which has a property 'metaData'
 * @returns {object}
 */
function toCallFnByUrlPath(res, callFn) {
  return _set(res, callFn.metaData.urlPath, callFn);
}

async function refreshCachedCalls(auth) {
  const callFnByUrlPath = _reduce(cachedCalls, toCallFnByUrlPath, {}),
    currentTime = Date.now(),
    isExpired = makeIsExpired(currentTime),
    urlPathsToRefresh = Object.keys(_omitBy(
      auth.lastUpdatedByUrlPath,
      isExpired
    ));

  for (const urlPath of urlPathsToRefresh) {
    const callFn = callFnByUrlPath[urlPath];

    await callFn(auth, { isRefresh: true });
  }
}

/**
 * refreshes all permissions as well as any cached calls
 *
 * @param {object} auth - req.session.auth.  This is mutated
 * @param {object} locals - This is also mutated
 */
module.exports = async auth => {
  await Promise.all([
    refreshPermissionsByDomain(auth),
    refreshCachedCalls(auth)
  ]);
};
