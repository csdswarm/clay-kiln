'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
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
    allStations: getEmptyAllStations()
  },
  resetAllStations = () => {
    _state.allStations = getEmptyAllStations();
  },
  /**
   * ensures _state.allStations is up to date
   * @param {object} locals
   */
  updateAllStations = async locals => {
    const stationsResp = await radioApi.get('stations', { page: { size: 1000 } }, null, {}, locals),
      apiEnvironment = getApiEnvironment(locals);

    if (stationsResp.response_cached === false && !_isEmpty(_state.allStations.asArray)) {
      return;
    }

    resetAllStations();

    // can't be declared above `resetAllStations`
    // eslint-disable-next-line one-var
    const { allStations } = _state;

    allStations.asArray[apiEnvironment] = stationsResp.data.map(station => station.attributes);

    allStations.asArray[apiEnvironment].forEach(station => {
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

module.exports = api;
