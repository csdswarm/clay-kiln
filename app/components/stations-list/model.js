'use strict';
const radioApiService = require('../../services/server/radioApi'),
  SPORTS_ID = '11',
  SPORTS_SLUG = 'sports',
  NEWSTALK_SLUG = 'news-talk',
  NEWSTALK_ID = '25';

/**
 * get market data from market slug
 * @param {string} market
 * @returns {object}
 */
function getMarketData(market) {
  const route = 'markets',
    /* note: filter by slug needs to be added to market api
    /* temporarily filter by market ID
    */
    // 'filter[slug]': market
    params = {
      'page[size]': 1000,
      'filter[id]': market
    };

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data[0] || {};
    } else {
      console.log('error with request', response);
      return {};
    }
  });
}

/**
 * get genre data from genre slug
 * @param {string} genre
 * @returns {object}
 */
function getGenreData(genre) {
  const route = 'genres',
    /* note: genre slug needs to be added to station api results
    /* temporarily filter by genre ID
    */
    // 'filter[slug]': genre
    params = {
      'page[size]': 1000,
      'filter[id]': genre
    };

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data[0] || {};
    } else {
      console.log('error with request', response);
      return {};
    }
  });
}

module.exports.render = async (uri, data, locals) => {
  const route = 'stations';
  let params = {
    'page[size]': 1000,
    sort: '-popularity'
  };

  if (locals.stationIDs) {
    params['filter[id]'] = locals.stationIDs;

    return radioApiService.get(route, params).then(response => {
      if (response.data) {
        let stations = locals.stationIDs.split(',').map(stationID => {
          let station = response.data.find(station => {
            if (station.id === parseInt(stationID)) {
              return station;
            }
          });

          return station ? station.attributes : null;
        });

        data.stations = stations.filter(station => station);
        return data;
      } else {
        return data;
      }
    });
  }

  if (data.filterBy === 'recent') {
    /** stations will be populated client side **/

    if (locals.station) {
      data.listTitle = data.listTitle || `${ data.filterBy } stations`;
    } else {
      data.listTitle = data.listTitle || 'stations you\'ve listened to';
    }

    return data;
  } else if (data.filterBy === 'local') {
    data.listTitle = data.listTitle || 'stations you\'ve listened to';

    return data;
  } else {
    /** filter by market, genre, or category **/
    if (locals.station) {
      /** for stations lists on station detail page (discover tab) **/

      switch (data.filterBy) {
        case 'market':
          data.market = locals.station.market.slug || locals.station.market.id; // note: market slug needs to be added to stations api
          data.seeAllLink = `/stations/location/${ data.market }`;
          data.listTitle = data.listTitle || `${ locals.station.market.display_name || locals.station.city || locals.station.market.name } stations`;
          params['filter[market_id]'] = locals.station.market.id;
          break;
        case 'genre':
          data.genre = locals.station.genre[0].slug || locals.station.genre[0].id; // note: genre slug needs to be added to stations api
          if (data.genre == SPORTS_ID || data.genre == NEWSTALK_ID || data.genre == SPORTS_SLUG || data.genre == NEWSTALK_SLUG) {
            data.seeAllLink = `/stations/${ data.genre }`;
          } else {
            data.seeAllLink = `/stations/music/${ data.genre }`;
          }
          data.listTitle = data.listTitle || `${ locals.station.genre[0].name } stations`;
          params['filter[genre_id]'] = locals.station.genre[0].id;
          break;
        default:
          break;
      }
    } else if (data.filterBy === 'market') {
      /** for stations lists on location stations directory page **/

      if (!locals.market && !locals.params.dynamicMarket) {
        // handle populating stations in client side
        return data;
      } else if (locals.params.dynamicMarket && data.truncatedList) {
        // fix for use case: both list components are rendering even when condition is met
        return data;
      }
      data.market = locals.market || locals.params.dynamicMarket; // should be slug. temporarily using id
      const marketData = await getMarketData(data.market);

      data.seeAllLink = `/stations/location/${ data.market }`;
      data.listTitle = marketData.attributes.display_name;
      params['filter[market_id]'] = marketData.id;
    } else if (data.filterBy === 'genre') {
      /** for stations lists on music, news & talk, and sports stations directory pages **/

      if (!locals.genre && !locals.params.dynamicGenre) {
        // handle populating stations in client side
        return data;
      } else if (locals.params.dynamicGenre && data.truncatedList) {
        return data;
      }
      data.genre = locals.genre || locals.params.dynamicGenre; // should be slug. temporarily using id
      const genreData = await getGenreData(data.genre);

      if (data.genre == SPORTS_ID || data.genre == NEWSTALK_ID || data.genre == SPORTS_SLUG || data.genre == NEWSTALK_SLUG) {
        data.seeAllLink = `/stations/${ data.genre }`;
      } else {
        data.seeAllLink = `/stations/music/${ data.genre }`;
      }
      data.listTitle = genreData.attributes.name;
      params['filter[genre_id]'] = genreData.id;
    } else if (data.filterBy === 'category') {
      /** for featured music, news talk, and sports stations list on featured stations directory page **/

      if (!locals.category) {
        return data;
      }
      data.category = locals.category;
      data.seeAllLink = `/stations/${ data.category }`;
      data.listTitle = `featured ${ data.category } stations`;
      if (data.category == NEWSTALK_SLUG) {
        data.listTitle = 'featured news & talk stations';
        params['filter[category]'] = 'news,talk';
      } else {
        params['filter[category]'] = data.category;
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
