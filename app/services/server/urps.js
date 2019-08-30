'use strict';

const
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename }),
  { refreshAuthToken } = require('./cognito'),
  cache = require('./cache'),
  { MINUTE } = require('../universal/constants').time,
  PERM_CHECK_INTERVAL = 5 * MINUTE;

/**
 * Gets all permissions for user with jwtToken from URPS and organizes them as a simple object for checking
 *
 * Why is data converted from its original array to an object?
 *  By converting to an object, not only is it a bit easier to use than constantly using `includes` or `find`, it
 *  is also more efficient. Additionally, since these permissions are likely to be sent to the client as well, it
 *  removes unnecessary information, such as ids and other extraneous information that are not necessary for
 *  permissions checking, which will simultaneously reduce overall bandwidth, while improving security
 *
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
    if (!jwtToken) {
      throw new Error('The jwtToken is a required parameter');
    }

    const options = { headers: { Authorization: jwtToken } },
      permissionsList = await rest.get(`${process.env.URPS_AUTHORIZATIONS_URL}/permissions/all`, options);

    return permissionsList
      .reduce((permissions, { type: permType, action, target: { type: targetType, value: target } }) => {
        const newPermission = { ...permissions[permType] },
          newAction = newPermission[action] = { ...newPermission[action] },
          newTargetType = newAction[targetType] = { ...newAction[targetType] };

        newTargetType[target] = 1; // using 1 instead of true to keep size down

        return { ...permissions, [permType]: { ...newPermission } };
      }, {});
  } catch (error) {
    log('error', 'There was a problem trying to get URPS permissions for the user', { error, jwtToken });
  }
}

/**
 * Assigns permissions to the user object
 * @param {Object} session user session object
 * @param {Object} locals locals
 * @returns {Promise<void>}
 */
async function loadPermissions(session, locals) {
  try {
    const currentTime = Date.now(),
      loginData = { ...session.auth };

    if (!loginData.token) {
      const key = `cognito-auth--${locals.user.username.toLowerCase()}`;

      Object.assign(loginData, JSON.parse(await cache.get(key) || '{}'));
      cache.del(key);
    }

    let { expires, permissions, lastUpdated } = loginData;

    if (expires < currentTime) {
      Object.assign(loginData, await refreshAuthToken(loginData));
    }

    if (!loginData.token) { // user not logged into cognito. can't get permissions at this time
      return;
    }

    if (!permissions || lastUpdated + PERM_CHECK_INTERVAL < currentTime) {
      permissions = await getAllPermissions(loginData.token);
      lastUpdated = currentTime;
    }

    session.auth = { ...loginData, permissions, lastUpdated };
    locals.permissions = session.auth.permissions;
  } catch (error) {
    log('error', `There was an error attempting to load user permissions for ${locals.user.username}.`, error);
  }
}

module.exports.getAllPermissions = getAllPermissions;
module.exports.loadPermissions = loadPermissions;
