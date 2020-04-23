'use strict';

const rest = require('../universal/rest'),
  promises = require('../universal/promises'),
  log = require('../universal/log').setup({ file: __filename }),
  isEmpty = require('lodash/isEmpty'),
  radioApi = 'api.radio.com/v1/',
  radioStgApi = 'api-stg.radio.com/v1/',
  qs = require('qs'),
  redis = require('./redis'),
  { addAmphoraRenderTime } = require('../universal/utils'),
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
   * @param {object} locals
   * @return {string}
   */
  createEndpoint = (route, params, locals) => {
    const decodeParams = params ? `?${decodeURIComponent(qs.stringify(params))}` : '',
      apiHost = shouldUseStagingApi(locals) ? radioStgApi : radioApi;

    return isRadioApiRoute(route) ?
      `https://${apiHost}${route}${decodeParams}` :
      `${route}${decodeParams}`;
  },
  /**
   * Determines whether we should use the staging api
   *
   * @param {object} locals
   * @returns {boolean}
   */
  shouldUseStagingApi = (locals) => {
    return locals.useStagingApi && !locals.edit;
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
   * options.ttl = soft TTL to compare against an updated_at value
   * options.expire = REDIS expire settings to expire the KEY and drop from REDIS
   *
   * @param {string} route
   * @param {*} [params]
   * @param {function} [validate]
   * @param {object} options
   * @param {object} locals
   * @return {Promise}
   */
  // eslint-disable-next-line max-params
  get = async (route, params, validate, options = {}, locals = {} ) => {
    if (options.shouldAddAmphoraTimings === undefined) {
      options.shouldAddAmphoraTimings = false;
    }

    const dbKey = createKey(route, params),
      validateFn = validate || defaultValidation(route),
      requestEndpoint = createEndpoint(route, params, locals),
      getFreshData = async (apiTimeout = API_TIMEOUT, cachedData = {}) => {
        try {
          // return api response if it's fast enough. if not, it might still freshen the cache
          const result = await promises.timeout(
            getAndSave(requestEndpoint, dbKey, validateFn, options, locals),
            apiTimeout
          );

          result.from_cache = false;
          // Set expires at to now + ttl
          result.redis_expires_at = getRedisExpiresAt(new Date(), options.ttl);
          return result;
        } catch (e) {
          // request failed, validation failed, or timeout. return empty object
          if (!isEmpty(cachedData)) {
            log('error', `Radio API error for endpoint ${requestEndpoint}:`, e);
            cachedData.from_cache = true;
            cachedData.redis_expires_at = getRedisExpiresAt(new Date(cachedData.updated_at), options.ttl);
          } else {
            log('error', `Radio API error for endpoint ${requestEndpoint} without REDIS cache:`, e);
          }
          return cachedData;
        }
      };

    if (typeof options.ttl !== 'number') {
      options.ttl = TTL.DEFAULT;
    }

    if (shouldUseStagingApi(locals)) {
      // setting the ttl to 0 will ensure fresh data that wont be saved to the cache
      options.ttl = 0;
    }

    try {
      // if there's no ttl, skip the cache miss and try to fetch new data
      if (!options.ttl) {
        return getFreshData();
      }

      const start = new Date();

      let cached;

      try {
        cached = await redis.get(dbKey);
      } finally {
        addAmphoraRenderTime(
          locals,
          {
            data: { dbKey },
            label: 'get from cache',
            ms: new Date() - start
          },
          {
            prefix: options.amphoraTimingLabelPrefix,
            shouldAdd: options.shouldAddAmphoraTimings
          }
        );
      }

      const data = JSON.parse(cached);

      // if there is no data in cache, wait on fresh data
      if (!cached) {
        return getFreshData();
      }

      if ((new Date() - new Date(data.updated_at) > options.ttl)) {
        // if the data is old, fire off a new api request to get it up to date, but don't wait on it
        return getFreshData(2000, data);
      }

      data.redis_expires_at = getRedisExpiresAt(new Date(data.updated_at), options.ttl);
      data.from_cache = true;
      return data;
    } catch (e) {
      return getFreshData();
    }
  },
  /**
   * Retrieve data from endpoint and save to db
   *
   * options.ttl = soft TTL to compare against an updated_at value
   * options.expire = REDIS expire settings to expire the KEY and drop from REDIS
   *
   * @param {string} endpoint
   * @param {string} dbKey
   * @param {function} validate
   * @param {object} options
   * @param {object} locals
   * @return {Promise}
   * @throws {Error}
   */
  // not worth refactoring right now, and the team agreed this lint rule should
  //   probably be disabled anyway.
  // eslint-disable-next-line max-params
  getAndSave = async (endpoint, dbKey, validate, options, locals) => {
    const ttl = options.ttl,
      expire = options.expire || false,
      start = new Date();

    let response;

    try {
      response = await rest.get(endpoint, options.headers);
    } finally {
      addAmphoraRenderTime(
        locals,
        {
          data: { endpoint },
          label: 'get and save',
          ms: new Date() - start
        },
        {
          prefix: options.amphoraTimingLabelPrefix,
          shouldAdd: options.shouldAddAmphoraTimings
        }
      );
    }

    if (validate(response)) {
      response.updated_at = new Date();

      // added to allow cache to be bypassed
      if (ttl > 0) {
        // use REDIS expire
        if (expire) {
          redis.set(dbKey, JSON.stringify(response), 'PX', expire)
            .catch(err => {
              const msg = 'error when setting with expire'
                + '\n  dbKey: ' + dbKey;

              log('error', msg, err);
            });
        } else {
          redis.set(dbKey, JSON.stringify(response))
            .catch(err => {
              const msg = 'error when saving to redis without expire'
                + '\n  dbKey: ' + dbKey;

              log('error', msg, err);
            });
        }
      }

      return response;

    } else {
      // Throw an error if no data is returned in case there is stale data in redis that can be served
      const err = new Error('Validation of data failed');

      err.localError = true;
      throw err;
    }
  },
  /**
   * Get the time in which the redis cache record will expire, the date object will be mutated
   *
   * @param {date} date
   * @param {number} ttl Milliseconds until cache expires
   * @return {date} date
   */
  getRedisExpiresAt = (date, ttl) => {
    date.setMilliseconds(date.getMilliseconds() + ttl);
    return date;
  };

module.exports.get = get;
module.exports.TTL = TTL;
module.exports.shouldUseStagingApi = shouldUseStagingApi;
