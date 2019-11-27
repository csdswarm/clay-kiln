'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  radioApi = require('./radioApi'),
  { URL } = require('url'),
  api = {},
  getEmptyAllStations = () => ({
    asArray: [],
    byCallsign: {},
    byId: {},
    bySlug: {}
  }),
  _state = {
    allStations: getEmptyAllStations()
  },
  resetAllStations = () => {
    _state.allStations = getEmptyAllStations();
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
   * @param {object} locals
   */
  updateAllStations = async locals => {
    const [ stationsResp, marketsResp ] = await Promise.all([
      radioApi.get('stations', { page: { size: 1000 } }, null, {}, locals),
      radioApi.get('markets', { page: { size: 100 } }, null, {}, locals)
    ]);

    if (stationsResp.response_cached === false && !_isEmpty(_state.allStations.asArray)) {
      return;
    }

    resetAllStations();

    // can't be declared above `resetAllStations`
    // eslint-disable-next-line one-var
    const { allStations } = _state;

    allStations.asArray = stationsResp.data.map(station => station.attributes);

    allStations.asArray.forEach(station => {
      station.timezone = marketsResp.data ?
        getTimezoneFromMarketID(
          marketsResp.data,
          station.market_id || station.market.id
        )
        : 'ET';

      allStations.byId[station.id] = station;
      allStations.bySlug[station.site_slug] = station;
      allStations.byCallsign[station.callsign] = station;
    });
  },
  /**
   * Just a helper to avoid 'await updateAllStations()' boilerplate
   *
   * @param {function} fn
   * @returns {function}
   */
  withUpdatedStations = fn => async (...args) => {
    await updateAllStations(_get(args, '[0].locals') || {});
    return fn(...args);
  },
  /**
   * If the url begins with a station slug, it returns that station.  Otherwise
   *   undefined is returned.
   *
   * @param {string} url
   * @returns {object|undefined}
   */
  getStationFromUrl = ({ url }) => {
    const slug = new URL(url).pathname.split('/')[1];

    return _state.allStations.bySlug[slug];
  };

/**
 * Returns an up-to-date _state.allStations
 *
 * @returns {object}
 */
api.getAllStations = withUpdatedStations(() => _state.allStations);

/**
 * Exposes the allStations state, ensuring they are updated when accessed
 *
 * Note: my decision to add these individually as functions was a mistake.  I
 *   should have just returned _state.allStations and let it be.  We can clean
 *   this up in the future but for now I don't want to break other
 *   people's code.
 */
Object.assign(api.getAllStations, {
  asArray: withUpdatedStations(() => _state.allStations.asArray),
  byCallsign: withUpdatedStations(() => _state.allStations.byCallsign),
  byId: withUpdatedStations(() => _state.allStations.byId),
  bySlug: withUpdatedStations(() => _state.allStations.bySlug)
});

/**
 * Returns the station callsign from a url, where the url either has a station
 *   slug at the beginning of the path in the url, or it doesn't which means the
 *   content belongs to the national station.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
api.getCallsignFromUrl = withUpdatedStations(({ url }) => {
  return _get(getStationFromUrl({ url }), 'callsign', 'NATL-RC');
});

/**
 * Finds the station name from the slug
 *
 * @param {string} slug
 * @returns {Promise<string>}
 */
api.getNameFromSlug = withUpdatedStations(({ slug }) => _state.allStations.bySlug[slug].name);

/**
 * Finds the station callsign from the slug
 *
 * @param {string} slug
 * @returns {Promise<string>}
 */
api.getCallsignFromSlug = withUpdatedStations(({ slug }) => _state.allStations.bySlug[slug].callsign);

/**
 * If the url has a station slug then it returns that station.  Otherwise
 *   undefined is returned.
 *
 * @param {string} url
 * @returns {object|undefined}
 */
api.getStationFromOriginalUrl = withUpdatedStations(getStationFromUrl);

module.exports = api;
