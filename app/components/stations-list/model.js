'use strict';
const radioApiService = require('../../services/server/radioApi'),
  SPORTS_ID = '11',
  SPORTS_SLUG = 'sports',
  NEWSTALK_SLUG = 'news-talk',
  NEWSTALK_ID = '25';

/**
 * get market ID from market slug
 * @param {string} market
 * @returns {Promise<number>}
 */
function getMarketID(market) {
  const route = 'markets',
    /* note: filter by slug needs to be added to market api
    */
    // params = { 'filter[slug]': market };
    params = {'page[size]': 100}

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data.find(({ attributes }) => attributes.display_name.toLowerCase() === market.toLowerCase()).id || '';
    } else {
      return '';
    }
  });
}

/**
 * get genre ID from genre slug
 * @param {string} genre
 * @returns {number}
 */
function getGenreID(genre) {
  const route = 'genres',
    /* note: genre slug needs to be added to station api results
    /* temporarily filter by genre ID
    */
    // params = { 'filter[slug]': genre };
    params = { 'filter[id]': genre };

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data.id || '';
    } else {
      return '';
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

    if (data.market || locals.params && locals.params.dynamicMarket) {
      /** for stations lists on location stations directory page **/

      data.market = data.market || locals.params.dynamicMarket; // should be slug. temporarily using id
      data.seeAllLink = `/stations/location/${ data.market }`;
      data.listTitle = data.listTitle || data.market;
      params['filter[market_id]'] = await getMarketID(data.market);
    } else if (data.genre || locals.params && locals.params.dynamicGenre) {
      /** for stations lists on music, news & talk, and sports stations directory pages **/

      data.genre = data.genre || locals.params.dynamicGenre; // should be slug. temporarily using id
      if (data.genre == SPORTS_ID || data.genre == NEWSTALK_ID || data.genre == SPORTS_SLUG || data.genre == NEWSTALK_SLUG) {
        data.seeAllLink = `/stations/${ data.genre }`;
      } else {
        data.seeAllLink = `/stations/music/${ data.genre }`;
      }
      data.listTitle = data.listTitle || data.genre;
      params['filter[genre_id]'] = await getGenreID(data.genre);
    } else if (data.filterBy == 'category') {
      /** for featured music, news talk, and sports stations list on featured stations directory page **/

      data.seeAllLink = `/stations/${ data.category }`;
      let listTitle;

      if (data.truncatedList) {
        listTitle = `featured ${ data.category } stations`;
      }
      data.listTitle = data.listTitle || listTitle || data.category;
      if (data.category == NEWSTALK_SLUG) {
        params['filter[category]'] = 'news,talk';
      } else {
        params['filter[category]'] = data.category;
      }
    } else if (locals.station) {
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
