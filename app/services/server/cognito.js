'use strict';

const util = require('util'),
  _get = require('lodash/get'),
  _fromPairs = require('lodash/fromPairs'),
  AWS = require('aws-sdk'),
  { SECOND } = require('../universal/constants').time;

/**
 * @typedef {Object} CognitoAuthInfo
 * @property {string} token - jwt access_token used to verify the user
 * @property {string} refreshToken - refresh token used to automatically refresh the user when `token` expires
 * @property {number} expires - the time in milliseconds (can be converted to Date) when the `token` will expire
 * @property {string} deviceKey - cognito device key, salt value also used to recognize client who originally made request
 * @property {number} lastUpdated - a number representing in milliseconds, the last time this data was updated
 *            it is used for refreshing permissions
 */

/**
 * Refreshes the user's authorization token
 * @param {string} refreshToken
 * @param {string} deviceKey
 * @returns {Promise<CognitoAuthInfo>}
 */
async function refreshAuthToken({ refreshToken, deviceKey }) {
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

  let authResult;

  if (process.env.COGNITO_CONSUMER_SECRET) {
    options.AuthParameters.SECRET_HASH = process.env.COGNITO_CONSUMER_SECRET;
  }

  authResult = _get(await initiateAuth(options), 'AuthenticationResult', {});

  return {
    token: authResult.AccessToken,
    refreshToken: authResult.RefreshToken,
    expires: Date.now() + ((authResult.ExpiresIn || 0) * SECOND),
    deviceKey: authResult.NewDeviceMetadata.DeviceKey,
    lastUpdated: Date.now()
  };
}

/**
 * Gets information about the user from cognito.
 * NOTE: this converts the cognito AttributeType array from Name, Value pairs into an object where the name
 * represents the key and the value is the value of the property
 * @param {string} jwtAccessToken
 * @returns {Promise<Object>}
 */
async function getUser(jwtAccessToken) {
  const cognitoClient = new AWS.CognitoIdentityServiceProvider(),
    getUser = util.promisify(cognitoClient.getUser).bind(cognitoClient),
    userData = await getUser({ AccessToken: _get(jwtAccessToken, '') }),
    userAttributes = _get(userData, 'UserAttributes', []);

  return _fromPairs(userAttributes.map(({ Name, Value }) => [Name, Value]));
}

module.exports = {
  refreshAuthToken,
  getUser
};
