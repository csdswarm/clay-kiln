'use strict';

let access_token,
  expires_in = 0,
  accessTokenUpdated = null;
const log = require('./log').setup({file: __filename}),
  rest = require('./rest'),
  brightcoveApi = `cms.api.brightcove.com/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/`,
  brightcoveOAuthApi = 'https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials',
  qs = require('qs'),
  methods = [
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE'
  ],

  /**
   * Creates a url from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @return {string}
   */
  createEndpoint = (route, params) => {
    const decodeParams =  params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return `https://${brightcoveApi}${route}${decodeParams}`;
  },
  /**
   * Retrieve access token and expiry time from oauth
   *
   * @return {Promise}
   * @throws {Error}
   */
  getAccessToken = async () => {
    const base64EncodedCreds = Buffer.from(`${process.env.BRIGHTCOVE_CLIENT_ID}:${process.env.BRIGHTCOVE_CLIENT_SECRET}`).toString('base64'),
      response = await rest.get(brightcoveOAuthApi, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Basic ${base64EncodedCreds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

    if (response.access_token) {
      accessTokenUpdated = new Date().getTime()/1000; // current time in seconds
      return response;
    } else {
      const e = new Error(`Failed to request access token. Error: ${response.response.statusText}`);

      log('error', e.message);
      return null;
      throw e;
    }
  },
  /**
   * Retrieve response from endpoint
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @param {boolean} [updateAccessToken]
   * @return {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data, updateAccessToken = false) => {
    try {
      const endpoint = createEndpoint(route, params),
        currentTime = new Date().getTime()/1000;

      if (updateAccessToken || !access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      if (!access_token) {
        return null;
      }

      const response = await rest.get(endpoint, {
        method: method && methods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET',
        body: data ? JSON.stringify(data) : '',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${ access_token }`
        }
      });

      return response;
    } catch (e) {
      log('error', e.response.statusText);
      return null;
      throw e;
    }
  };

module.exports.request = request;
