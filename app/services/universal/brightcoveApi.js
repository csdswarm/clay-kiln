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
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST),
  TTL = 300000,
  methods = [
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE'
  ],
  /**
   * Creates a redis key from route, params, api
   *
   * @param {string} route
   * @param {object} params
   * @param {string} api
   * @return {string}
   */
  createKey = (route, params, api) => {
    const encodeParams =  params ? `?${qs.stringify(params)}` : '';

    return `${api}.${route}${encodeParams}`;
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
        break;
      default:
        apiUrl = brightcoveCmsApi;
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
   * Get an API response from cache
   *
   * @param {string} key
   * @param {integer} ttl
   * @returns {object}
   */
  getFromCache = async (key, ttl) => {
    try {
      const cached = await redis.get(key),
        data = JSON.parse(cached);

      if (data.updated_at && (new Date() - new Date(data.updated_at) > ttl)) {
        return null;
      } else {
        data.response_cached = true;
        return data;
      }
    // catch cache miss
    } catch (e) {
      return null;
    }
  },
  /**
   * Retrieve response from api endpoint
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @param {string} api
   * @param {string} key
   * @return {Promise}
   * @throws {Error}
   */
  hitApiAndSave = async (method, route, params, data, api, key) => {
    try {
      const endpoint = createEndpoint(route, params, api),
        currentTime = new Date().getTime() / 1000;

      if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      if (!access_token) {
        return null;
      }

      const response = await rest.request(endpoint, {
        method,
        body: data ? JSON.stringify(data) : '',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      });

      if (method == 'GET' && key) {
        response.updated_at = new Date();

        try {
          redis.set(key, JSON.stringify(response));
        } catch (e) {
          log('error', e.message);
        }
      }

      return response;

    } catch (e) {
      log('error', e.response.statusText);
      return null;
    }
  },
  /**
   * Retrieve response from api endpoint or cache
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @param {string} api
   * @param {integer} ttl
   * @return {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data, api = 'cms', ttl = TTL) => {
    let { method, route, params, data, api, ttl } = options;

    method = method && methods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET';

    if (method == 'GET') {
      const key = createKey(route, params, api),
        data = await getFromCache(key, ttl);

      if (data) {
        return data;
      } else {
        return await hitApiAndSave(method, route, params, data, api, key);
      }

    } else {
      return await hitApiAndSave(method, route, params, data, api);
    }
  };

module.exports.request = request;
