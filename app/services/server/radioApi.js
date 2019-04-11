'use strict';

const rest = require('../universal/rest'),
  radioApi = 'api.radio.com/v1/',
  qs = require('qs'),
  db = require('./db'),
  TTL = {
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
   * @param {number} [ttl]
   * @return {Promise}
   */
  get = async (route, params, validate, ttl = TTL.DEFAULT ) => {
    const dbKey = createKey(route, params),
      validateFn = validate || defaultValidation(route),
      requestEndpoint = createEndpoint(route, params);

    try {
      const data = await db.get(dbKey);

      if (data.updated_at && (new Date() - new Date(data.updated_at) > ttl)) {
        try {
          return await getAndSave(requestEndpoint, dbKey, validateFn);
        } catch (e) {
        }
      }
      // If API errors out or within TTL, return existing data
      data.response_cached = true;
      return data;
    } catch (e) {
      try {
        // if an issue with getting the key, get the data
        return await getAndSave(requestEndpoint, dbKey, validateFn);
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
   * @return {Promise}
   * @throws {Error}
   */
  getAndSave = async (endpoint, dbKey, validate) => {
    try {
      const response =  await rest.get(endpoint);

      if (validate(response)) {
        response.updated_at = new Date();

        try {
          db.put(dbKey, JSON.stringify(response));
        } catch (e) {
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
