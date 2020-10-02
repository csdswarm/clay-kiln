'use strict';

const util = require('util'),
  log = require('../universal/log').setup({ file: __filename }),
  _get = require('lodash/get'),
  AWS = require('aws-sdk'),
  { SECOND } = require('../universal/constants').time;

/**
 * @typedef {Object} CognitoAuthInfo
 * @property {string} accessToken - jwt access_token used to verify the user
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

  try {
    if (process.env.COGNITO_CONSUMER_SECRET) {
      options.AuthParameters.SECRET_HASH = process.env.COGNITO_CONSUMER_SECRET;
    }

    const authResult = _get(await initiateAuth(options), 'AuthenticationResult', {});

    return {
      accessToken: authResult.AccessToken,
      deviceKey,
      expires: Date.now() + ((authResult.ExpiresIn || 0) * SECOND),
      idToken: authResult.IdToken,
      lastUpdated: Date.now(),
      refreshToken
    };
  } catch (error) {
    log('error', 'There was an error attempting to refresh the cognito access token', error);
  }
}

module.exports = { refreshAuthToken };
