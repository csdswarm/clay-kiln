'use strict';

const rest = require('../universal/rest'),
  promises = require('../universal/promises'),
  log = require('../universal/log').setup({ file: __filename }),
  radioApi = 'api.radio.com/v1/',
  qs = require('qs'),
  redis = require('./redis'),
  TTL = {
    NONE: 0,
    DEFAULT: 300000,
    MIN: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
  API_TIMEOUT = 6000,
  httpRegEx = /^https?:\/\//,

  /**
   * Returns if the route passed in is for api.radio.com or a different location
   *
   * @param {string} route
   * @return {boolean}
   */
  isRadioApiRoute = (route) => !httpRegEx.test(route),
  /**
   * Creates a dbKey from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @return {string}
   */
  createKey = (route, params) => {
    const encodeParams =  params ? `?${qs.stringify(params)}` : '';

    return isRadioApiRoute(route) ?
      `${radioApi}${route}${encodeParams}` :
      `${route.replace(httpRegEx, '')}${encodeParams}`;
  },
  /**
   * Creates a url from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @return {string}
   */
  createEndpoint = (route, params) => {
    const decodeParams =  params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return isRadioApiRoute(route) ?
      `https://${radioApi}${route}${decodeParams}` :
      `${route}${decodeParams}`;
  },
  /**
   * returns a function to verify the response of the call was valid
   *
   * @param {string} route
   * @return {function}
   */
  defaultValidation = (route) => isRadioApiRoute(route) ? (response) => response.data : () => true,
  /**
   * Retrieve data from Redis or an endpoint
   *
   * @param {string} route
   * @param {*} [params]
   * @param {function} [validate]
   * @param {object} options
   * @return {Promise}
   */
  get = async (route, params, validate, options = {} ) => {
    const dbKey = createKey(route, params),
      validateFn = validate || defaultValidation(route),
      requestEndpoint = createEndpoint(route, params),
      getFreshData = async () => {
        try {
          // return api response if it's fast enough. if not, it might still freshen the cache
          return await promises.timeout(getAndSave(requestEndpoint, dbKey, validateFn, options), API_TIMEOUT);
        } catch (e) {
          // request failed, validation failed, or timeout. return empty object

          log('error', `Radio API error for endpoint ${requestEndpoint}:`, e);

          return {};
        }
      };

    if (typeof options.ttl !== 'number') options.ttl = TTL.DEFAULT;

    try {
      // if there's no ttl, skip the cache miss and try to fetch new data
      if (!options.ttl) {
        return await getFreshData();
      }

      const cached = await redis.get(dbKey),
        data = JSON.parse(cached);

      // if there is no data in cache, wait on fresh data
      if (!cached) {
        return await getFreshData();
      }

      if (data.updated_at && (new Date() - new Date(data.updated_at) > options.ttl)) {
        // if the data is old, fire off a new api request to get it up to date, but don't wait on it
        getAndSave(requestEndpoint, dbKey, validateFn, options)
          .catch(() => {});
      }

      // always return cached if it's available
      data.response_cached = true;
      return data;
    } catch (e) {
      return await getFreshData();
    }
  },
  /**
   * Retrieve data from endpoint and save to db
   *
   * @param {string} endpoint
   * @param {string} dbKey
   * @param {function} validate
   * @param {object} options
   * @return {Promise}
   * @throws {Error}
   */
  getAndSave = async (endpoint, dbKey, validate, options) => {
    try {
      const ttl = options.ttl,
        response = await rest.get(endpoint, options.headers);

      if (validate(response)) {
        response.updated_at = new Date();

        // added to allow cache to be bypassed
        if (ttl > 0) {
          redis.set(dbKey, JSON.stringify(response))
            .catch(() => {});
        }

        return response;

      } else {
        // Throw an error if no data is returned in case there is stale data in redis that can be served
        const err = new Error('Validation of data failed');

        err.localError = true;
        throw err;
      }
    } catch (e) {
      // Throw an error if no data is returned in case there is stale data in redis that can be served
      throw e.localError ? e : new Error('No data returned from endpoint');
    }
  };

module.exports.get = get;
module.exports.TTL = TTL;
