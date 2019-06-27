'use strict';

let access_token,
  expires_in = 0,
  accessTokenUpdated = null;

const log = require('./log').setup({file: __filename}),
  rest = require('./rest'),
  brightcoveCmsApi = `cms.api.brightcove.com/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/`,
  brightcoveAnalyticsApi = 'analytics.api.brightcove.com/v1/data',
  brightcoveOAuthApi = 'https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials',
  qs = require('qs'),
  radioApi = require('../server/radioApi'),
  methods = [
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE'
  ],
  /**
   * sets the brightcove url and params for the api
   *
   * @param {string} api
   * @param {object} params
   * @return {string}
   */
  getBrightcoveUrl = (api, params) => {
    let url;

    switch (api) {
      // analytics data endpoint is odd... "accounts" is a param
      // https://analytics.api.brightcove.com/v1/data?accounts=account_id(s)&dimensions=video&where=video==video_id
      case 'analytics':
        url = brightcoveAnalyticsApi;
        if (params) {
          params.accounts = process.env.BRIGHTCOVE_ACCOUNT_ID;
        }
        break;
      default:
        url = brightcoveCmsApi;
    }

    return `https://${url}`;
  },
  /**
   * Creates a url from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @param {string} api
   * @return {string}
   */
  createEndpoint = (route, params, api) => {
    let apiUrl = getBrightcoveUrl(api, params);

    route = route || '';

    const decodeParams =  params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return `${apiUrl}${route}${decodeParams}`;
  },
  /**
   * Retrieve access token and expiry time from oauth
   *
   * @return {Promise}
   * @throws {Error}
   */
  getAccessToken = async () => {
    const currentTime = new Date().getTime() / 1000;

    if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
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
        access_token = response.access_token;
        expires_in = response.expires_in;
      } else {
        const e = new Error(`Failed to request access token. Error: ${response.response.statusText}`);

        log('error', e.message);
        return null;
      }
    } else {
      return { access_token, expires_in };
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
  request = async (method, route, params, data) => {
    try {
      const endpoint = createEndpoint(route, params);

      await getAccessToken();
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
  },
  /**
   * uses the radioApi get/caching to
   *
   * @param {Object} options
   * @return {Promise}
   */
  get = async (options) => {
    // test1: "{{domain}}/api/brightcove?api=cms&ttl=0&route=videos%2F{{videoId}}",
    // test2: "{{domain}}/api/brightcove?api=analytics&ttl=0&params%5Bdimensions%5D=video&params%5Bwhere%5D=video%3D%3D{{videoId}}"

    await getAccessToken();
    if (!access_token) {
      return null;
    }

    const { api, route, params, ttl } = options,
      url = getBrightcoveUrl(api, params),
      endpoint = route ? `${url}${route}` : url,
      headers = {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      },
      radioApiOptions = {
        ttl,
        headers
      };

    return await radioApi.get(endpoint, params, null, radioApiOptions);
  };

module.exports.request = request;
module.exports.get = get;
