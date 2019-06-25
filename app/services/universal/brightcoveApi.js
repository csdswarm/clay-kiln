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
  TTL = {
    DEFAULT: 300000,
    MIN: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
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

    route = route || '';

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

    route = route || '';

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
   * Get a response either from cache or the api
   *
   * @param {Object} options
   * @returns {Promise}
   */
  getFromCacheOrApi = async (options) => {
    const { method, route, params, data, api, ttl } = options;

    if (method == 'GET') {
      const key = createKey(route, params, api),
        data = await getFromCache(key, ttl);

      if (data) {
        return data;
      } else {
        return await hitApiAndSave({ method, route, params, data, api, key });
      }

    } else {
      return await hitApiAndSave({ method, route, params, data, api });
    }
  },
  /**
   * Get an API response from cache
   *
   * @param {string} key
   * @param {integer} ttl
   * @returns {Promise}
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
   * @param {object} options
   * @return {Promise}
   * @throws {Error}
   */
  hitApiAndSave = async (options) => {
    try {
      if (!access_token || (accessTokenUpdated && (new Date().getTime() / 1000) >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      if (!access_token) {
        return null;
      }

      const { method, route, params, data, api, key } = options,
        endpoint = createEndpoint(route, params, api),
        response = await rest.request(endpoint, {
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
   * @return {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data) => {
    method = method && methods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET';

    // defaults for existing functionality which needs to bypass cache
    const api = 'cms';

    return hitApiAndSave({ method, route, params, data, api });
  },
  /**
   * hit the analytics api to get video analytics
   *
   * @param {integer} videoId
   * @param {integer} ttl
   * @returns {Promise}
   */
  getVideoAnalytics = async (videoId, ttl = 5 * TTL.MIN) => {
    const api = 'analytics',
      method = 'GET',
      params = {
        dimensions: 'video',
        where: `video==${videoId}`
      };

    return getFromCacheOrApi({ method, params, api, ttl });
  },
  /**
   * hit the cms api to get video data
   *
   * @param {integer} videoId
   * @param {integer} ttl
   * @returns {Promise}
   */
  getVideoDetails = async (videoId, ttl = TTL.HOUR) => {
    const route = `videos/${videoId}`,
      api = 'cms',
      method = 'GET';

    return getFromCacheOrApi({ method, route, api, ttl });
  };

module.exports.request = request;
module.exports.getVideoAnalytics = getVideoAnalytics;
module.exports.getVideoDetails = getVideoDetails;
