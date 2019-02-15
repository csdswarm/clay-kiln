'use strict';

const rest = require('../universal/rest'),
  radioApi = 'api.radio.com/v1/',
  qs = require('qs'),
  db = require('./db'),
  TTL = 300000,
  httpRegEx = /^https?:\/\//,

  /**
   * Creates a dbKey from a route and params
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
  defaultValidation = (route) => isRadioApiRoute(route) ? (response) => response.data : () => true;

/**
 * Retrieve data from Redis or an endpoint
 *
 * @param {string} route
 * @param {*} [params]
 * @param {function} [validate]
 * @return {Promise}
 */
function get(route, params, validate = defaultValidation(route)) {
  const dbKey = createKey(route, params),
    requestEndpoint = createEndpoint(route, params);

  return db.get(dbKey)
    .then(function (data) {
      if (data.updated_at && (new Date() - new Date(data.updated_at) > TTL)) {
        return getAndSave(requestEndpoint, dbKey, validate).catch(function () {
          // If API errors out, return stale data
          return data;
        });
      }
      return data;
    })
    .catch(function (e) {
      return getAndSave(requestEndpoint, dbKey, validate).catch(function () {
        // If API errors out and we don't have stale data, return empty object
        return {};
      });
    });
}

/**
 * Retrieve data from endpoint and save to db
 *
 * @param {string} endpoint
 * @param {string} dbKey
 * @param {function} validate
 * @return {Promise}
 * @throws {Error}
 */
function getAndSave(endpoint, dbKey, validate) {
  return rest.get(endpoint).then(response => {
    if (validate(response)) {
      response.updated_at = new Date();
      try {
        return db.put(dbKey, JSON.stringify(response)).then(function () {
          return response;
        });
      } catch (e) {
        return response;
      }
    } else {
      // Throw an error if no data is returned in case there is stale data in redis that can be served
      throw new Error('Validation of data failed');
    }
  }).catch(() => {
    // Throw an error if no data is returned in case there is stale data in redis that can be served
    throw new Error('No data returned from endpoint');
  });
}

module.exports.get = get;
