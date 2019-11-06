'use strict';
const localStorageKey = 'recentStations',
  maxRecentStations = 49;

/**
 * Get IDs of recent stations from localStorage
 * @function
 * @returns {Object[]}
 */
function get() {
  const recentStationsIDs = localStorage.getItem(localStorageKey);

  if (!recentStationsIDs) {
    return [];
  } else {
    return recentStationsIDs.split(',').filter(function (stationID) {
      // Remove stored station objects
      return !isNaN(parseInt(stationID));
    });
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
      return parseInt(recentStationID) !== stationID;
    }).slice(0, maxRecentStations); // limit stations stored

    recentStationsIDs.unshift(stationID); // add new

    try {
      localStorage.setItem(localStorageKey, recentStationsIDs.join()); // Store recent stations in browser
    } catch (e) {
      console.log(`Error storing station ${stationID}: ${e}`);
    }
  }
}

module.exports = {
  get: get,
  add: add
};
