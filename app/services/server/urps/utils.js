'use strict';

const _set = require('lodash/set'),
  { SECOND } = require('../../universal/constants').time;

const PERM_CHECK_INTERVAL = 30 * SECOND,
  // the urps team doesn't have their CORE_ID working yet so we need to
  //   validate until that's turned on
  USE_URPS_CORE_ID = process.env.USE_URPS_CORE_ID === 'true';

/**
 * assigns the value 'true' to the path `${action}.${target}`
 *
 * @param {object} domainPermissions - the domain object containing its permissions.  This is mutated
 * @param {object} perm - the domain permission object returned from urps
 * @returns {object} - the mutated domainPermissions object
 */
function toDomainLevelPermissions(domainPermissions, perm) {
  const {
    permissionName: action,
    permissionCategoryName: target
  } = perm;

  return _set(domainPermissions, [action, target], true);
}

/**
 * assigns the domain permissions by domain name
 *
 * @param {object} permissionsObj - the final permissions object.  This is mutated
 * @param {object} domain - object returned from urps
 * @returns {object} - the mutated permissionsObj
 */
function toPermissionsByDomain(permissionsObj, domain) {
  const domainName = USE_URPS_CORE_ID ? `${domain.type} - ${domain.core_id}` : domain.name;

  return _set(
    permissionsObj,
    [domainName],
    domain.permissions.reduce(toDomainLevelPermissions, {})
  );
}

/**
 * using the permissionsList from urps, create the permissions object utilized
 *   by unity
 *
 * @param {object[]} permissionsList
 * @returns {object}
 */
function createUnityPermissions(permissionsList) {
  return permissionsList.reduce(toPermissionsByDomain, {});
}

module.exports = {
  createUnityPermissions,
  PERM_CHECK_INTERVAL,
  USE_URPS_CORE_ID
};
