'use strict';

const _set = require('lodash/set'),
  { SECOND } = require('../../universal/constants').time;

const PERM_CHECK_INTERVAL = 30 * SECOND;

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
  return _set(
    permissionsObj,
    [domain.name],
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
  PERM_CHECK_INTERVAL
};
