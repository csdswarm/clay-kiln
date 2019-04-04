'use strict';
const radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
  SPORTS_SLUG = 'sports',
  NEWSTALK_SLUG = 'news-talk';

/**
 * get market data from market slug or ID
 * @param {string} slug
 * @param {number} [id]
 * @returns {object}
 */
function getMarketData({ slug, id }) {
  const route = 'markets',
    /* @TODO filter by slug needs to be added to market api
    /* temporarily filter by market ID
    */
    // 'filter[slug]': market
    params = {
      'page[size]': 1000
    };

  if (id) {
    params['filter[id]'] = id;
  }

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      if (id) {
        return response.data.shift();
      }
      return response.data.find(({ attributes }) => slugifyService(attributes.display_name) === slug) || {};
    } else {
      console.log('error with request', response);
      return {};
    }
  });
}

/**
 * get genre data from genre slug or ID
 * @param {string} slug
 * @param {number} [id]
 * @returns {object}
 */
function getGenreData({ slug, id }) {
  const route = 'genres',
    /* temporarily filter by genre ID
    */
    // 'filter[slug]': genre
    params = {
      'page[size]': 1000
    };

  if (id) {
    params['filter[id]'] = id;
  }

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      if (id) {
        return response.data.shift();
      }
      return response.data.find(({ attributes }) => slugifyService(attributes.name) === slug) || {};
    } else {
      console.log('error with request', response);
      return {};
    }
  });
}

module.exports.render = async (uri, data, locals) => {
  data.stations = [];
  const route = 'stations',
    params = {
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
          data.market = slugifyService(locals.station.market.display_name);
          data.seeAllLink = `/stations/location/${ data.market }`;
          data.listTitle = data.listTitle || `${ locals.station.market.display_name || locals.station.city || locals.station.market.name } stations`;
          params['filter[market_id]'] = locals.station.market.id;
          break;
        case 'genre':
          data.genre = slugifyService(locals.station.genre[0].name);
          if (data.genre === SPORTS_SLUG || data.genre === NEWSTALK_SLUG) {
            data.seeAllLink = `/stations/${ data.genre }`;
          } else {
            data.seeAllLink = `/stations/music/${ data.genre }`;
          }
          data.listTitle = `${ locals.station.genre[0].name } stations`;
          params['filter[genre_id]'] = locals.station.genre[0].id;
          break;
        default:
          break;
      }
    } else if (data.filterBy === 'market') {
      /** for stations lists on location stations directory page **/
      if (locals.params) {
        if (!locals.params.dynamicMarket && !locals.market
          || locals.params.dynamicMarket && data.truncatedList ) {
          // fix for use case: both list components are rendering even when condition is met
          // handle populating stations in client side
          return data;
        }
      }
      const market = {
          id: locals.market,
          slug: locals.params.dynamicMarket
        },
        marketData = await getMarketData(market);

      data.seeAllLink = marketData.attributes ? `/stations/location/${ slugifyService(marketData.attributes.display_name) }` : '/stations/location';
      data.listTitle = marketData.attributes ? marketData.attributes.display_name : '';
      params['filter[market_id]'] = marketData.id;
    } else if (data.filterBy === 'genre') {
      /** for stations lists on music, news & talk, and sports stations directory pages **/

      if (locals.params) {
        if (!locals.params.dynamicGenre && !locals.genre
          || locals.params.dynamicGenre && data.truncatedList ) {
          // fix for use case: both list components are rendering even when condition is met
          // handle populating stations in client side
          return data;
        }
      }
      const genre = {
          id: locals.genre,
          slug: locals.params.dynamicGenre
        },
        genreData = await getGenreData(genre);

      if (slugifyService(genreData.attributes.name) === SPORTS_SLUG ||
        slugifyService(genreData.attributes.name) === NEWSTALK_SLUG) {
        data.seeAllLink = genreData.attributes ? `/stations/${ slugifyService(genreData.attributes.name) }` : '/stations';
      } else {
        data.seeAllLink = genreData.attributes ? `/stations/music/${ slugifyService(genreData.attributes.name) }` : '/stations/music';
      }
      data.listTitle = genreData.attributes ? genreData.attributes.name : '';
      params['filter[genre_id]'] = genreData.id;
    } else if (data.filterBy === 'category') {
      /** for featured music, news talk, and sports stations list on featured stations directory page **/

      if (!locals.category) {
        return data;
      }
      data.category = locals.category;
      data.seeAllLink = `/stations/${ data.category }`;
      data.listTitle = `featured ${ data.category } stations`;
      if (data.category === NEWSTALK_SLUG) {
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
