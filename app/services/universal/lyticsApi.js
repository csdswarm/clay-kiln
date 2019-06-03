'use strict';

const accessToken = process.env.LYTICS_API_KEY,
  lyticsAPI = 'api.lytics.io/api',
  log = require('./log').setup({file: __filename}),
  rest = require('./rest'),
  qs = require('qs'),
  createEndpoint = (route, params) => {
    const decodeParams = params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    return `https://${lyticsAPI}${route}${decodeParams}`;
  },
  request = async (route, params) => {
    try {
      const endpoint = createEndpoint(route, {access_token: accessToken, ...params});

      return await rest.get(endpoint);
    } catch (e) {
      log('error', e);
      log('error', e.response.statusText);
      return null;
    }
  },
  recommend = async (fieldValue, params, fieldName = 'uid') => {
    return await request(`/content/recommend/user/${fieldName}/${fieldValue}`, params);
  };

module.exports.recommend = recommend;
module.exports.request = request;
