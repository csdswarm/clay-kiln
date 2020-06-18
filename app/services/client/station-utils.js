'use strict';

const apiService = require('./radioApi');

module.exports = {

  /**
   * Gets station data for a provided list of stations
   * @param {[string|number]} stationIds A list of station IDs
   * @returns {Promise<[object]>}
   */

  getStationsById: async (stationIds) => {
    const route = 'http://clay.radio.com/station-utils/stations-by-id/' + stationIds.join(',');

    return await apiService.get(route);
  }
};
