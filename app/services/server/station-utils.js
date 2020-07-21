'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  _pick = require('lodash/pick'),
  radioApi = require('./radioApi'),
  { URL } = require('url'),
  { DEFAULT_STATION } = require('../universal/constants'),
  api = {},
  getEmptyAllStations = () => ({
    asArray: {
      stg: [],
      prd: []
    },
    byCallsign: {
      stg: {},
      prd: {}
    },
    byId: {
      stg: {},
      prd: {}
    },
    bySlug: {
      stg: {},
      prd: {}
    }
  }),
  _state = {
    allStations: getEmptyAllStations(),
    redisExpiresAt: null
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
    const apiEnvironment = getApiEnvironment(locals);

    // Short circuit if we already have this data
    if (!_isEmpty(_state.allStations.asArray[apiEnvironment]) && _state.redisExpiresAt && (new Date() < _state.redisExpiresAt)) {
      return;
    }

    resetAllStations();

    const [ stationsResp, marketsResp ] = await Promise.all([
      radioApi.get('stations', { page: { size: 1000 } }, null, {}, locals),
      radioApi.get('markets', { page: { size: 100 } }, null, {}, locals)
    ]);

    // Set the expires at timer based on return
    _state.redisExpiresAt = stationsResp.redis_expires_at;

    // can't be declared above `resetAllStations`
    // eslint-disable-next-line one-var
    const { allStations } = _state;

    allStations.asArray[apiEnvironment] = stationsResp.data.map(station => station.attributes);

    allStations.asArray[apiEnvironment].forEach(station => {
      station.timezone = marketsResp.data ?
        getTimezoneFromMarketID(
          marketsResp.data,
          station.market_id || station.market.id
        )
        : 'ET';

      allStations.byId[apiEnvironment][station.id] = station;
      allStations.bySlug[apiEnvironment][station.site_slug] = station;
      allStations.byCallsign[apiEnvironment][station.callsign] = station;
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
   * @param {object} locals
   * @returns {object|undefined}
   */
  getStationFromUrl = ({ url, locals }) => {
    const slug = new URL(url).pathname.split('/')[1];

    return _state.allStations.bySlug[getApiEnvironment(locals)][slug];
  },
  /**
   * Get the environment currently being used
   *
   * @param {object} locals
   * @returns {string}
   */
  getApiEnvironment = (locals) => {
    return radioApi.shouldUseStagingApi(locals) ? 'stg' : 'prd';
  };

/**
 * Returns an up-to-date _state.allStations
 *
 * @param {object} argObj
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {object}
 */
api.getAllStations = withUpdatedStations(({ locals }) =>  {
  const returnData = {};

  Object.keys(_state.allStations).forEach( key => {
    returnData[key] = _state.allStations[key][getApiEnvironment(locals)];
  });

  return returnData;
});

/**
 * Exposes the allStations state, ensuring they are updated when accessed
 *
 * Note: my decision to add these individually as functions was a mistake.  I
 *   should have just returned _state.allStations and let it be.  We can clean
 *   this up in the future but for now I don't want to break other
 *   people's code.
 *
 * Each call has the following params
 *
 * @param {object} argObj
 * @param {object} [argObj.locals] - used by withUpdatedStations
 */
Object.assign(api.getAllStations, {
  asArray: withUpdatedStations(({ locals }) => _state.allStations.asArray[getApiEnvironment(locals)]),
  byCallsign: withUpdatedStations(({ locals }) => _state.allStations.byCallsign[getApiEnvironment(locals)]),
  byId: withUpdatedStations(({ locals }) => _state.allStations.byId[getApiEnvironment(locals)]),
  bySlug: withUpdatedStations(({ locals }) => _state.allStations.bySlug[getApiEnvironment(locals)])
});

/**
 * Returns the station callsign from a url, where the url either has a station
 *   slug at the beginning of the path in the url, or it doesn't which means the
 *   content belongs to the national station.
 *
 * @param {object} argObj
 * @param {string} argObj.url
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {Promise<string>}
 */
api.getCallsignFromUrl = withUpdatedStations(({ url, locals }) => {
  return _get(getStationFromUrl({ url, locals }), 'callsign', 'NATL-RC');
});

/**
 * Finds the station name from the slug
 *
 * @param {object} argObj
 * @param {string} argObj.slug
 * @param {object} [argObj.locals] - used by withUpdatedStations
 */
api.getNameFromSlug = withUpdatedStations(({ slug, locals }) => _state.allStations.bySlug[getApiEnvironment(locals)][slug].name);

/**
 * Finds the station callsign from the slug
 *
 * @param {object} argObj
 * @param {string} argObj.slug
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {Promise<string>}
 */
api.getCallsignFromSlug = withUpdatedStations(({ slug, locals }) => _state.allStations.bySlug[getApiEnvironment(locals)][slug].callsign);

/**
 * If the url has a station slug then it returns that station.  Otherwise
 *   undefined is returned.
 *
 * @param {object} argObj
 * @param {string} argObj.url
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {object|undefined}
 */
api.getStationFromOriginalUrl = withUpdatedStations(getStationFromUrl);

/**
 * Get a list of all the station callsigns with NATL-RC as a station
 *   optionally passing the default station callsign
 *
 * @param {boolean} addDefaultCallsign
 * @returns {array}
 */
api.getAllStationsCallsigns = withUpdatedStations(({ locals, addDefaultCallsign = true }) => {
  const callsigns = Object.keys(_state.allStations.byCallsign[getApiEnvironment(locals)]);

  if (addDefaultCallsign) {
    callsigns.push(DEFAULT_STATION.callsign);
  }

  return callsigns.sort();
});


/**
 * Gets a list of specific stations, by calling getAllStations and filtering the list
 *
 * @param {object} argObj
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @param {object} [argObj.ids] - used when getting stations by id
 */
api.getSomeStations = {
  byId: async ({ locals, ids }) => {
    const allStations = await api.getAllStations.byId({ locals });

    return _pick(allStations,ids);
  }
};

module.exports = api;
