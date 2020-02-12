'use strict';

const accessToken = process.env.LYTICS_API_KEY,
  lyticsAPI = process.env.LYTICS_API_URL,
  log = require('./log').setup({ file: __filename }),
  rest = require('./rest'),
  qs = require('qs'),
  /**
   * Create url string from route and encoded params
   * @param {string} route
   * @param {object} params
   *
   * @return {string} endpoint
   */
  createEndpoint = (route, params) => {
    const decodeParams = params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return `${lyticsAPI}${route}${decodeParams}`;
  },
  /**
   * Make a request of the lytics api
   * @param {string} route
   * @param {object} params
   *
   * @return {Promise}
   */
  request = async (route, params) => {
    try {
      const endpoint = createEndpoint(route, { access_token: accessToken, ...params });

      return await rest.get(endpoint);
    } catch (e) {
      log('error', 'error requesting the lytics api', e);
      return null;
    }
  },
  /**
   * Get lytics recommendations for a specific user
   * @param {string} fieldValue
   * @param {object} params
   * @param {string} fieldName
   *
   * @return {array}
   */
  recommend = async (fieldValue, params, fieldName = '_uid') => {
    return await request(`/content/recommend/user/${fieldName}/${fieldValue}`, params)
      .then(recommendations => recommendations ? recommendations.data : []);
  };

module.exports.recommend = recommend;
