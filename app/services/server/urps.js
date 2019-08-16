'use strict';

const rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename });

/**
 * Gets all permissions for user with jwtToken from URPS and organizes them as a simple object for checking
 * @param { string } jwtToken the jwt Token of the authenticated user to authorizations for
 * @returns {Promise<Object>}
 *
 * @example
 * // returns an object in the form of
 * // {[permissionType]:{[action]:{[targetType]:[type]: 1}}}
 * // where permissionType will typically be the name of a component, layout or page
 * //       action will be what can be done, like import, publish, update, etc
 * //       targetType will be the type of target, if any, such as station
 * //       target will be that actual target, such as a station callsign
 * const hasPermission = getAllPermissions(token);
 * if(hasPermission.article.publish.station[station.callsign]) {
 *   ...
 * }
 * // OR
 * if(hasPermission['alert-banner'].any) {
 *   ...
 * }
 */
async function getAllPermissions(jwtToken) {
  try {
    const options = { headers: { Authorization: jwtToken } };
    const permissionsList = await rest.get(`${process.env.URPS_AUTHORIZATIONS_URL}/permissions/all`, options);

    return permissionsList
      .reduce((permissions, {type: permType, action, target: {type: targetType, value: target}}) => {
        const newPermission = {...permissions[permType]},
          newAction = newPermission[action] = {...newPermission[action]},
          newTargetType = newAction[targetType] = {...newAction[targetType]};
        newTargetType[target] = 1;
        return {...permissions, [permType]: {...newPermission}};
      }, {});
  } catch (error) {
    log('error', 'There was a problem trying to get URPS permissions for the user', { error, jwtToken });
  }
}

module.exports.getAllPermissions = getAllPermissions;
