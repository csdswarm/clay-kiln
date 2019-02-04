'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * get market ID from market slug
 * @param {string} marketSlug
 * @returns {number}
 */
function getMarketID(marketSlug) {
  // BLOCKED BY API WORK
  let marketID;
  const route = 'markets',
    params = {'filter[slug]': marketSlug};

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data.id || '';
    } else {
      return '';
    }
  });
}

/**
 * get genre ID from genre slug
 * @param {string} genreSlug
 * @returns {number}
 */
function getGenreID(genreSlug) {
  const route = 'genres',
    params = {'filter[slug]': genreSlug};

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data.id || '';
    } else {
      return '';
    }
  });
}

module.exports.render = (uri, data, locals) => {
  if (data.filterBy == 'recent') {
    // data.stations = stations stored in local storage on page view AND station play

    return data;
  } else {
    const route = 'stations';
    let params;

    if (locals.params.dynamicMarket) {
      params = {'filter[market_id]': getMarketID(locals.params.dynamicMarket)};
    } else if (locals.params.dynamicGenre) {
      params = {'filter[genre_id]': getGenreID(locals.params.dynamicGenre)};
    } else if (locals.station) {

      switch (data.filterBy) {
        case 'location':
          params = {'filter[market_id]': locals.station.market.id};
          break;
        case 'genre':
          params = {'filter[genre_id]': locals.station.genre.id};
          break;
      }
    }

    return radioApiService.get(route, params).then(response => {
      if (response.data) {
        data.stations = response.data || [];

        return data;
      } else {
        return data;
      }
    });
  }
};
