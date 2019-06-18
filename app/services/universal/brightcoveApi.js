'use strict';

let access_token,
  expires_in = 0,
  accessTokenUpdated = null;
const log = require('./log').setup({file: __filename}),
  rest = require('./rest'),
  brightcoveCmsApi = `cms.api.brightcove.com/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/`,
  brightcoveAnalyticsApi = 'analytics.api.brightcove.com/v1/data',
  brightcovePlaybackApi = `edge.api.brightcove.com/playback/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/`,
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
  createEndpoint = (route, params, api = 'cms') => {

    let apiUrl;
    switch (api) {
      case 'cms': 
        apiUrl = brightcoveCmsApi;
        break;
      // analytics data endpoint is odd... "accounts" is a param
      // https://analytics.api.brightcove.com/v1/data?accounts=account_id(s)&dimensions=video&where=video==video_id
      case 'analytics': 
        apiUrl = brightcoveAnalyticsApi;
        params = params || {};
        params.accounts = process.env.BRIGHTCOVE_ACCOUNT_ID;
        route = '';
        break;
      // https://support.brightcove.com/overview-playback-api#Get_video_by_id
      case 'playback':
        apiUrl = brightcovePlaybackApi;
        break;
    }

    const decodeParams =  params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return `https://${apiUrl}${route}${decodeParams}`;
  },
  /**
   * Retrieve access token and expiry time from oauth
   *
   * @return {Promise}
   * @throws {Error}
   */
  getAccessToken = async () => {
    const base64EncodedCreds = Buffer.from(`${process.env.BRIGHTCOVE_CLIENT_ID}:${process.env.BRIGHTCOVE_CLIENT_SECRET}`).toString('base64'),
      response = await rest.request(brightcoveOAuthApi, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Basic ${base64EncodedCreds}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

    if (response.access_token) {
      accessTokenUpdated = new Date().getTime() / 1000; // current time in seconds
      return response;
    } else {
      const e = new Error(`Failed to request access token. Error: ${response.response.statusText}`);

      log('error', e.message);
      return null;
    }
  },
  /**
   * Retrieve response from endpoint
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @return {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data, api = 'cms') => {
    try {
      const endpoint = createEndpoint(route, params, api),
        currentTime = new Date().getTime() / 1000;

      if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      if (!access_token) {
        return null;
      }

      return await rest.request(endpoint, {
        method: method && methods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET',
        body: data ? JSON.stringify(data) : '',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      });
    } catch (e) {
      log('error', e.response.statusText);
      return null;
    }
  };

module.exports.request = request;
