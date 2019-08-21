'use strict';

const
  util = require('util'),
  AWS = require('aws-sdk'),
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename }),
  cache = require('./cache'),
  SECOND = 1000,
  MINUTE = 60 * SECOND,
  PERM_CHECK_INTERVAL = 5 * MINUTE;

/**
 * Gets all permissions for user with jwtToken from URPS and organizes them as a simple object for checking
 * @param { string } jwtToken the jwt Token of the authenticated user to authorizations for
 * @returns {Promise<Object>}
 *
 * Why are we converting from an array to an object?
 *  By converting to an object, not only is it a bit easier to use that constantly using `includes` or `find`, it
 *  is also more efficient. Additionally, since these permissions are likely to be sent to the client as well, it
 *  removes unnecessary information, such as ids and other extraneous information that are not necessary for
 *  permissions checking, which will simultaneously reduce overall bandwidth, while improving security
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
 * Refreshes the user's authorization token
 * @param {string} refreshToken
 * @param {string} deviceKey
 * @returns {Promise<CognitoIdentityServiceProvider.Types.InitiateAuthResponse>}
 */
function refreshAuthToken({ refreshToken, deviceKey }) {
  const cognitoClient = new AWS.CognitoIdentityServiceProvider(),
    initiateAuth = util.promisify(cognitoClient.initiateAuth).bind(cognitoClient),
    options = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.COGNITO_CONSUMER_KEY,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        DEVICE_KEY: deviceKey
      }
    };

  if (process.env.COGNITO_CONSUMER_SECRET) {
    options.AuthParameters.SECRET_HASH = process.env.COGNITO_CONSUMER_SECRET;
  }

  return initiateAuth(options);
}

/**
 * Assigns permissions to the user object
 * @param {Object} session user session object
 * @param {Object} user locals.user
 * @returns {Promise<void>}
 */
async function loadPermissions(session, user) {
  try {
    const currentTime = Date.now(),
      loginData = session.auth || await cache.get(user.username);

    if (session.auth.expires < currentTime) {
      const authResult = (await refreshAuthToken(loginData) || {}).AuthenticationResult;

      Object.assign(loginData, {
        token: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        expires: Date.now() + ((authResult.ExpiresIn || 0) * SECOND),
        deviceKey: authResult.NewDeviceMetadata.DeviceKey,
        lastUpdated: currentTime
      });
    }

    if (!session.auth.permissions || session.auth.lastUpdated + PERM_CHECK_INTERVAL < currentTime) {
      loginData.permissions = await getAllPermissions(loginData.token);
      session.auth.lastUpdated = currentTime;
    }

    session.auth = { ...session.auth, ...loginData };
    user.permissions = loginData.permissions;

  } catch (error) {
    log('error', `There was an error attempting to load user permissions for ${user.username}.`, error);
  }
}

module.exports.getAllPermissions = getAllPermissions;
module.exports.loadPermissions = loadPermissions;
