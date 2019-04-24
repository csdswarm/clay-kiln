'use strict';
const localStorageKey = 'recentStations',
  maxRecentStations = 49;

/**
 * Get IDs of recent stations from localStorage
 * @function
 * @returns {Object[]}
 */
function get() {
  let recentStationsIDs = localStorage.getItem(localStorageKey);

  if (!recentStationsIDs) {
    return [];
  } else {
    return recentStationsIDs.split(',');
  }
}

/**
 * Add ID of most recent station to localStorage (Should trigger on station play only)
 * @function
 * @param {object} stationID
 */
function add(stationID) {
  if (stationID) {
    const recentStationsIDs = this.get().filter(recentStationID => { // dedupe
      return recentStationID !== stationID;
    }).slice(0, maxRecentStations); // limit stations stored

    recentStationsIDs.unshift(stationID); // add new

    try {
      localStorage.setItem(localStorageKey, recentStationsIDs.join()); // Store recent stations in browser
    } catch (e) {
      console.log('error storing station: ', e);
    }
  }
}

module.exports = {
  get: get,
  add: add
};
