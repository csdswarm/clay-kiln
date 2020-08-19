'use strict';

const formatPossibleAxiosError = require('../../universal/format-possible-axios-error'),
  getFromUrps = require('./get-from-urps'),
  log = require('../../universal/log').setup({ file: __filename }),
  { createUnityPermissions, USE_URPS_CORE_ID } = require('./utils'),
  { unityAppDomainName, unityAppId } = require('../../universal/urps');

/**
 * Gets all permissions for user with jwt from URPS and organizes them as a simple object for checking
 *
 * Why is data converted from its original array to an object?
 *  By converting to an object, not only is it a bit easier to use than constantly using `includes` or `find`, it
 *  is also more efficient. Additionally, since these permissions are likely to be sent to the client as well, it
 *  removes unnecessary information, such as ids and other extraneous information that are not necessary for
 *  permissions checking, which will simultaneously reduce overall bandwidth, while improving security
 *
 * @param {string} idToken the jwt Token of the authenticated user to authorizations for
 * @param {Array} stationDomainNames
 * @returns {Promise<Object>}
 *
 * @example
 * // returns an object in the form of
 * // {[domain name]:{[action]:{[target]:true}}}
 * // where permissionType will typically be the name of a component, layout or page
 * //       action will be what can be done, like import, publish, update, etc
 * //       targetType will be the type of target, if any, such as station
 * //       target will be that actual target, such as a station callsign
 * const hasPermission = getAllPermissions(idToken);
 * if(hasPermission.article.publish.station[station.callsign]) {
 *   ...
 * }
 * // OR
 * if(hasPermission['alert-banner'].any) {
 *   ...
 * }
 */
module.exports = async (idToken, stationDomainNames) => {
  try {
    if (!idToken) {
      throw new Error('idToken is a required parameter');
    }
    
    const { data: permissionsList } = await getFromUrps(
      '/permissions/by-domain',
      { domains: USE_URPS_CORE_ID ? [unityAppId, ...stationDomainNames] : [unityAppDomainName, ...stationDomainNames] },
      idToken
    );

    return createUnityPermissions(permissionsList);
  } catch (error) {
    log(
      'error',
      'There was a problem trying to get URPS permissions for the user'
      + `\n\n${formatPossibleAxiosError(error)}`,
      { idToken }
    );

    return {};
  }
};
