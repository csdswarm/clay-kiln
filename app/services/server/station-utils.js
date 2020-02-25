'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  radioApi = require('./radioApi'),
  { URL } = require('url'),
  { DEFAULT_STATION } = require('../universal/constants'),
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
   * ensures _state.allStations is up to date
   * @param {object} locals
   */
  updateAllStations = async locals => {
    const resp = await radioApi.get('stations', { page: { size: 1000 } }, null, {}, locals);

    if (resp.response_cached === false && !_isEmpty(_state.allStations.asArray)) {
      return;
    }

    resetAllStations();

    // can't be declared above `resetAllStations`
    // eslint-disable-next-line one-var
    const { allStations } = _state;

    allStations.asArray = resp.data.map(station => station.attributes);

    allStations.asArray.forEach(station => {
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
 * @param {object} argObj
 * @param {object} [argObj.locals] - used by withUpdatedStations
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
 *
 * Each call has the following params
 *
 * @param {object} argObj
 * @param {object} [argObj.locals] - used by withUpdatedStations
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
 * @param {object} argObj
 * @param {string} argObj.url
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {Promise<string>}
 */
api.getCallsignFromUrl = withUpdatedStations(({ url }) => {
  return _get(getStationFromUrl({ url }), 'callsign', 'NATL-RC');
});

/**
 * Finds the station name from the slug
 *
 * @param {object} argObj
 * @param {string} argObj.slug
 * @param {object} [argObj.locals] - used by withUpdatedStations
 */
api.getNameFromSlug = withUpdatedStations(({ slug }) => _state.allStations.bySlug[slug].name);

/**
 * Finds the station callsign from the slug
 *
 * @param {object} argObj
 * @param {string} argObj.slug
 * @param {object} [argObj.locals] - used by withUpdatedStations
 * @returns {Promise<string>}
 */
api.getCallsignFromSlug = withUpdatedStations(({ slug }) => _state.allStations.bySlug[slug].callsign);

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
api.getAllStationsCallsigns = withUpdatedStations((addDefaultCallsign = true) => {
  const callsigns = Object.keys(_state.allStations.byCallsign);

  if (addDefaultCallsign) {
    callsigns.push(DEFAULT_STATION.callsign);
  }

  return callsigns.sort();
});

module.exports = api;
