'use strict';

const rest = require('../universal/rest'),
  radioApi = 'api.radio.com/v1/',
  qs = require('qs'),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST),
  TTL = 300000;

/**
 * Retrieve data from Redis or api.radio.com
 *
 * @param {*} route
 * @param {*} params
 * @return {Promise}
 */
function get(route, params) {
  const requestEndpoint = `${radioApi}${route}?${qs.stringify(params)}`;

  return redis.get(requestEndpoint)
    .then(function (data) {
      if (data.updated_at && (new Date() - new Date(data.updated_at) > TTL)) {
        return getFromApi(decodeURIComponent(requestEndpoint)).catch(function () {
          // If API errors out, return stale data
          return data;
        });
      }
      return data;
    })
    .catch(function () {
      return getFromApi(requestEndpoint).catch(function () {
        // If API errors out and we don't have stale data, return empty object
        return {};
      });
    });
}

/**
 * Retrieve data from api.radio.com
 *
 * @param {string} endpoint
 * @return {Promise}
 * @throws {Error}
 */
function getFromApi(endpoint) {
  return rest.get(`https://${endpoint}`).then(response => {
    if (response.data) {
      response.updated_at = new Date();
      return redis.set(decodeURIComponent(endpoint), JSON.stringify(response)).then(function () {
        return response;
      });
    } else {
      // Throw an error if no data is returned in case there is stale data in redis that can be served
      throw new Error('No data returned from API');
    }
  });
}

module.exports.get = get;
