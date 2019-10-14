'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  radioApi = require('./radioApi'),
  { URL } = require('url'),
  api = {},
  _state = {
    allStations: {
      bySlug: {},
      byCallsign: {},
      asArray: []
    },
    allMarkets: []
  },
  /**
   * Get timezone from market api
   *
   * @param {Array} markets
   * @param {Number} marketID
   * @returns {String}
   */
  getTimezoneFromMarketID = (markets, marketID) => {
    const market = markets.find(market => {
      return market.id === marketID;
    });

    switch (_get(market, 'attributes.timezone', 'US/Eastern')) {
      case 'US/Pacific':
        return 'PT';
      case 'US/Mountain':
      case 'MT':
        return 'MT';
      case 'US/Central':
        return 'CT';
      case 'US/Eastern':
      default:
        return 'ET';
    }
  },
  /**
   * ensures _state.allStations is up to date
   */
  updateAllStations = async () => {
    const { allStations } = _state,
      [ stationsResp, marketsResp ] = await Promise.all([
        radioApi.get('stations', { page: { size: 1000 } }),
        radioApi.get('markets', { page: { size: 100 } })
      ]);

    if (stationsResp.response_cached && !_isEmpty(allStations.asArray)) {
      return;
    }

    allStations.asArray = stationsResp.data;

    stationsResp.data.forEach(station => {
      station.attributes.timezone = getTimezoneFromMarketID(marketsResp.data,
        station.attributes.market_id || station.attributes.market.id);

      allStations.bySlug[station.attributes.site_slug] = station;
      allStations.byCallsign[station.attributes.callsign] = station;
    });
  },
  /**
   * Just a helper to avoid 'await updateAllStations()' boilerplate
   *
   * @param {function} fn
   * @returns {function}
   */
  withUpdatedStations = fn => async (...args) => {
    await updateAllStations();
    return fn(...args);
  },
  /**
   * If the url begins with a station slug, it returns that station.  Otherwise
   *   undefined is returned.
   *
   * @param {string} url
   * @returns {object|undefined}
   */
  getStationFromUrl = url => {
    const slug = new URL(url).pathname.split('/')[1];

    return _state.allStations.bySlug[slug];
  };

/**
 * Exposes the allStations state, ensuring they are updated when accessed
 *
 * Note: if more keys are added to the allStations state then we can generate
 *   this getAllStations via a function.  For now this is easier to read.
 */
api.getAllStations = {
  asArray: withUpdatedStations(() => _state.allStations.asArray),
  byCallsign: withUpdatedStations(() => _state.allStations.byCallsign),
  bySlug: withUpdatedStations(() => _state.allStations.bySlug)
};

/**
 * Returns the station callsign from a url, where the url either has a station
 *   slug at the beginning of the path in the url, or it doesn't which means the
 *   content belongs to the national station.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
api.getCallsignFromUrl = withUpdatedStations(url => _get(getStationFromUrl(url), 'attributes.callsign', 'NATL-RC'));

/**
 * Finds the station callsign from the slug
 *
 * @param {string} slug
 * @returns {Promise<string>}
 */
api.getCallsignFromSlug = withUpdatedStations(slug => _state.allStations.bySlug[slug].attributes.callsign);

/**
 * If the url has a station slug then it returns that station.  Otherwise
 *   undefined is returned.
 *
 * @param {string} url
 * @returns {object|undefined}
 */
api.getStationFromOriginalUrl = withUpdatedStations(getStationFromUrl);

/**
 * Finds the station data from the slug
 *
 * @param {string} slug
 * @returns {Promise<Object>}
 */
api.getStationDataFromSlug = withUpdatedStations(slug => {
  const { name,
    timezone,
    callsign
  } = _state.allStations.bySlug[slug].attributes;

  return { name,
    timezone,
    callsign
  };
});

module.exports = api;
