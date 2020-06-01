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
 * a reducer which turns cachedCalls into a mapping of cachedPropName -> the
 *   call function
 *
 * @param {object} res - result
 * @param {function} callFn - the actual function to call which has a property 'metaData'
 * @returns {object}
 */
function toCallFnByCachedPropName(res, callFn) {
  return _set(res, callFn.metaData.cachedPropName, callFn);
}

async function refreshCachedCalls(auth) {
  const callFnByCachedPropName = _reduce(cachedCalls, toCallFnByCachedPropName, {}),
    currentTime = Date.now(),
    isExpired = makeIsExpired(currentTime),
    cachedPropNamesToRefresh = Object.keys(_omitBy(
      auth.lastUpdatedByCachedPropName,
      isExpired
    ));

  for (const cachedPropName of cachedPropNamesToRefresh) {
    const callFn = callFnByCachedPropName[cachedPropName];

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
