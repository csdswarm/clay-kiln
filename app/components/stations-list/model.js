'use strict';
const radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
  { playingClass, favoriteModifier } = require('../../services/server/spaLocals'),
  _get = require('lodash/get'),
  SPORTS_SLUG = 'sports',
  NEWS_SLUG = 'news',
  NEWSTALK_SLUG = 'news-talk';

/**
 * get market data from market slug or ID
 * @param {object} locals
 * @param {string} slug
 * @param {number} [id]
 * @returns {object}
 */
function getMarketData(locals, { slug, id }) {
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

  return radioApiService.get(route, params, null, {}, locals).then(response => {
    if (response.data) {
      if (id) {
        return response.data.shift();
      }
      return response.data.find(({ attributes }) => slugifyService(attributes.display_name) === slug) || {};
    } else {
      console.log('Error with getMarketData request', response);
      return {};
    }
  });
}

/**
 * get genre data from genre slug or ID
 * @param {object} locals
 * @param {string} slug
 * @param {number} [id]
 * @returns {object}
 */
function getGenreData(locals, { slug, id }) {
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

  return radioApiService.get(route, params, null, {}, locals).then(response => {
    if (response.data) {
      if (id) {
        return response.data.shift();
      }
      return response.data.find(({ attributes }) => slugifyService(attributes.name) === slug) || {};
    } else {
      console.log('Error with getGenreData request', response);
      return {};
    }
  });
}

/**
 * Strip data of stations array to signal original rendering before we have data
 *
 * @param {object} data
 * @return {object}
 */
function returnStationless(data) {
  delete data.stations;
  return data;
}

module.exports.render = async (uri, data, locals) => {
  const route = 'stations',
    params = {
      'page[size]': 1000,
      sort: '-popularity'
    },
    isStation = _get(locals, 'station.slug', 'www') !== 'www';

  if (locals.stationIDs || data.filterBy === 'favorites') {
    const stationIDs = locals.stationIDs || _get(locals, 'radiumUser.favoriteStations', []).join();

    if (stationIDs) {
      params['filter[id]'] = stationIDs;
    }

    return radioApiService.get(route, params, null, {}, locals).then(response => {
      if (response.data) {
        const stations = stationIDs.split(',').map(stationID => {
          const station = response.data.find(station => {
            if (station.id === parseInt(stationID)) {
              return station;
            }
          });

          if (station) {
            station.attributes.playingClass = playingClass(locals, station.attributes.id);
            station.attributes.favoriteModifier = favoriteModifier(locals, station.attributes.id);

            return station.attributes;
          }

          return null;
        });

        data.stations = stations.filter(station => station);
        return data;
      } else {
        return returnStationless(data);
      }
    });
  }

  if (data.filterBy === 'recent') {
    /** stations will be populated client side **/

    if (isStation) {
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
    if (isStation) {
      /** for stations lists on station detail page (discover tab) **/
      switch (data.filterBy) {
        case 'market':
          data.market = slugifyService(locals.station.market.display_name);
          data.seeAllLink = `/stations/location/${ data.market }`;
          data.listTitle = data.listTitle || `${ locals.station.market.display_name || locals.station.city || locals.station.market.name } stations`;
          params['filter[market_id]'] = locals.station.market.id;
          break;
        case 'genre':
          if (!locals.station.genre.length) {
            return returnStationless(data);
          }

          data.genre = slugifyService(locals.station.genre[0].name);
          if (data.genre === SPORTS_SLUG) {
            data.seeAllLink = `/stations/${ data.genre }`;
          } else if (data.genre === NEWSTALK_SLUG || data.genre === NEWS_SLUG) {
            data.seeAllLink = `/stations/${ NEWSTALK_SLUG }`;
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
      if (!locals.params) {
        return returnStationless(data);
      }
      /** for stations lists on location stations directory page **/
      if (!locals.params.dynamicMarket && !locals.market
        || locals.params.dynamicMarket && data.truncatedList ) {
        // fix for use case: both list components are rendering even when condition is met
        // handle populating stations in client side
        return returnStationless(data);
      }

      const market = {
          id: locals.market,
          slug: locals.params.dynamicMarket
        },
        marketData = await getMarketData(locals, market);

      data.seeAllLink = marketData.attributes ? `/stations/location/${ slugifyService(marketData.attributes.display_name) }` : '/stations/location';
      data.listTitle = marketData.attributes ? marketData.attributes.display_name : '';
      params['filter[market_id]'] = marketData.id;
    } else if (data.filterBy === 'genre') {
      /** for stations lists on music, news & talk, and sports stations directory pages **/
      const genre = {
        id: locals.genre
      };

      if (locals.params) {
        if ((!locals.params.dynamicGenre && !locals.genre)
          || (locals.params.dynamicGenre && data.truncatedList)) {
          // fix for use case: both list components are rendering even when condition is met
          // handle populating stations in client side
          return returnStationless(data);
        }

        genre.slug = locals.params.dynamicGenre;
      }

      // ensure there is one or the other required elements
      if (!genre.id && !genre.slug) {
        return returnStationless(data);
      }

      // eslint-disable-next-line one-var
      const genreData = await getGenreData(locals, genre);

      if (slugifyService(genreData.attributes.name) === SPORTS_SLUG ||
        slugifyService(genreData.attributes.name) === NEWSTALK_SLUG) {
        data.seeAllLink = `/stations/${ slugifyService(genreData.attributes.name) }`;
        data.truncatedList = false;
      } else if (slugifyService(genreData.attributes.name) === NEWS_SLUG) {
        data.seeAllLink = `/stations/${ NEWSTALK_SLUG }`;
        data.truncatedList = false;
      } else {
        data.seeAllLink = genreData.attributes ? `/stations/music/${ slugifyService(genreData.attributes.name) }` : '/stations/music';
      }
      data.listTitle = genreData.attributes ? genreData.attributes.name : '';
      params['filter[genre_id]'] = genreData.id;
    } else if (data.filterBy === 'category') {
      /** for featured music, news talk, and sports stations list on featured stations directory page **/

      if (!locals.category) {
        return returnStationless(data);
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

    return radioApiService.get(route, params, null, {}, locals).then(response => {
      if (response.data) {
        data.stations = response.data ? response.data.map((station) => {
          station.attributes.playingClass = playingClass(locals, station.attributes.id);
          station.attributes.favoriteModifier = favoriteModifier(locals, station.attributes.id);

          return station.attributes;
        }) : [];
        data.stationIds = data.stations.map((station) => { return { id: station.id }; });
        return data;
      } else {
        return data;
      }
    });
  }
};
