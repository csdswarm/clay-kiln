'use strict';

const rest = require('../universal/rest'),
  radioApi = 'api.radio.com/v1/',
  clayUrl = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}`,
  env = process.env.NODE_ENV || 'prod',
  qs = require('qs'),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST),
  TTL = {
    NONE: 0,
    DEFAULT: 300000,
    MIN: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
  httpRegEx = /^https?:\/\//,

  /**
   * Returns if the route passed in is for api.radio.com or a different location
   *
   * @param {string} route
   * @return {boolean}
   */
  isRadioApiRoute = (route) => !httpRegEx.test(route),
  /**
   * Returns if the route passed in is for radio.com or a different location
   * If it is, we need to add port 3001 on local env only
   *
   * @param {string} route
   * @return {boolean}
   */
  isClayRoute = (route) => route.includes(clayUrl),
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

    if (isRadioApiRoute(route)) {
      return `https://${radioApi}${route}${decodeParams}`;
    } else if (isClayRoute(route) && env == 'local') {
      return `${route.replace(clayUrl, `${clayUrl}:3001`)}${decodeParams}`;
    } else {
      return `${route}${decodeParams}`;
    }
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
      requestEndpoint = createEndpoint(route, params);

    options.ttl = options.ttl || TTL.DEFAULT;

    // could add a check to see if ttl is set to 0 so we don't have cache misses that we know are going to miss
    try {
      const cached = await redis.get(dbKey),
        data = JSON.parse(cached);

      if (data.updated_at && (new Date() - new Date(data.updated_at) > options.ttl)) {
        try {
          return await getAndSave(requestEndpoint, dbKey, validateFn, options);
        } catch (e) {
        }
      }
      // If API errors out or within TTL, return existing data
      data.response_cached = true;
      return data;
    } catch (e) {
      try {
        // if an issue with getting the key, get the data
        return await getAndSave(requestEndpoint, dbKey, validateFn, options);
      } catch (e) {
        // If API errors out and we don't have stale data, return empty object
        return {};
      }
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
        response =  await rest.get(endpoint, options.headers);

      if (validate(response)) {
        response.updated_at = new Date();

        // added to allow cache to be bypassed
        if (ttl > 0) {
          try {
            redis.set(dbKey, JSON.stringify(response));
          } catch (e) {
          }
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
