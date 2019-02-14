'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * get market ID from market slug
 * @param {string} market
 * @returns {number}
 */
function getMarketID(market) {
  const route = 'markets',
    /* note: filter by slug needs to be added to market api
    /* temporarily filter by market ID
    */
    // params = { 'filter[slug]': market };
    params = { 'filter[id]': market };

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
  if (data.filterBy == 'recent') {
    /** stations will be populated client side **/

    if (locals.station) {
      data.listTitle = data.listTitle || `${ data.filterBy } stations`;
    } else {
      data.listTitle = data.listTitle || 'stations you\'ve listened to';
    }

    return data;
  } else if (data.filterBy == 'local') {
    /** stations will be populated client side **/

    data.listTitle = data.listTitle || 'stations you\'ve listened to';

    return data;
  } else {
    /** filter by market, genre, or category **/

    const route = 'stations';
    let params = {
      'page[size]': 350, // note: page[size]=all needs to be added
      sort: '-popularity'
    };

    if (data.market || locals.params && locals.params.dynamicMarket) {
      /** for stations lists on location stations directory page **/

      data.market = data.market || locals.params.dynamicMarket; // should be slug. temporarily using id
      data.seeAllLink = `/stations/location/${ data.market }`;
      data.listTitle = data.listTitle || data.market;
      params['filter[market_id]'] = await getMarketID(data.market);
    } else if (data.genre || locals.params && locals.params.dynamicGenre) {
      /** for stations lists on music, news & talk, and sports stations directory pages **/

      data.genre = data.genre || locals.params.dynamicGenre; // should be slug. temporarily using id
      if (data.genre == '11' || data.genre == '25' || data.genre == 'sports' || data.genre == 'news-talk') {
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
      if (data.category == 'news-talk') {
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
          data.listTitle = data.listTitle || `${ locals.station.market.display_name || locals.station.city } stations`;
          params['filter[market_id]'] = locals.station.market.id;
          break;
        case 'genre':
          data.genre = locals.station.genre[0].slug || locals.station.genre[0].id; // note: genre slug needs to be added to stations api
          if (data.genre == '11' || data.genre == '25' || data.genre == 'sports' || data.genre == 'news-talk') {
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
