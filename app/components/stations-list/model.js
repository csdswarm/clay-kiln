'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * get market ID from market slug
 * @param {string} marketSlug
 * @returns {number}
 */
function getMarketID(marketSlug) {
  const route = 'markets',
    // params = {'filter[slug]': marketSlug}; // BLOCKED BY API WORK
    params = {'filter[id]': marketSlug}; // temporarily filter by market ID

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
  if (data.filterBy == 'recent' || data.filterBy == 'local') { // stations will be populated client side
    data.listTitle = data.listTitle || `${data.filterBy} stations`;

    return data;
  } else { // filter by market or genre
    const route = 'stations';
    let params = {
      'page[size]': 350
    };

    if (locals.params.dynamicMarket) {
      data.listTitle = data.listTitle || `${locals.params.dynamicMarket} stations`;
      params['filter[market_id]'] = getMarketID(locals.params.dynamicMarket);
    } else if (locals.params.dynamicGenre) {
      data.listTitle = data.listTitle || `${locals.params.dynamicGenre} stations`;
      params['filter[genre_id]'] = getGenreID(locals.params.dynamicGenre);
    } else if (locals.station) {
      switch (data.filterBy) {
        case 'market':
          params['filter[market_id]'] = locals.station.market.id;
          data.listTitle = data.listTitle || `${locals.station.city} stations`;
          break;
        case 'genre':
          data.listTitle = data.listTitle || `${locals.station.genre} stations`;
          params['filter[genre_id]'] = locals.station.genre.id;
          break;
      }
    }

    return radioApiService.get(route, params).then(response => {
      if (response.data) {
        data.stations = response.data ? response.data.map((station) => station.attributes) : [];

        return data;
      } else {
        return data;
      }
    });
  }
};
