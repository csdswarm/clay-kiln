'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  radioApi = require('./radioApi'),
  { URL } = require('url'),
  { DEFAULT_STATION } = require('../universal/constants')
  api = {},
  _state = {
    allStations: {
      bySlug: {},
      byCallsign: {},
      asArray: []
    }
  },
  /**
   * ensures _state.allStations is up to date
   */
  updateAllStations = async () => {
    const resp = await radioApi.get('stations', { page: { size: 1000 } }),
      { allStations } = _state;

    if (resp.response_cached && !_isEmpty(allStations.asArray)) {
      return;
    }

    allStations.asArray = resp.data;

    resp.data.forEach(station => {
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
api.getCallsignFromUrl = withUpdatedStations(url => {
  return _get(getStationFromUrl(url), 'attributes.callsign', 'NATL-RC');
});

/**
 * Finds the station name from the slug
 *
 * @param {string} slug
 * @returns {Promise<string>}
 */
api.getNameFromSlug = withUpdatedStations(slug => _state.allStations.bySlug[slug].attributes.name);

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
 * Get a list of all the station callsigns with NATL-RC as a station
 *   optionally passing the default station callsign
 *
 * @returns {array}
 */
api.getAllStationsCallsigns = withUpdatedStations(() =>
  [
    DEFAULT_STATION.callsign,
    ...Object.keys(_state.allStations.byCallsign)
  ].sort()
);

module.exports = api;
