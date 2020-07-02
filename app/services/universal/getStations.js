'use strict';

const axios = require('axios');

module.exports = {
  /**
   * Gets station data for a provided list of stations
   * @param {[string|number]} stationIds A list of station IDs
   * @returns {Promise<[object]>}
   */

  getStationsById: async (stationIds) => {
    if (!stationIds || !stationIds.length)
      return {};
    const protocol = 'https:',
      host = typeof window === 'undefined' ? process.env.CLAY_SITE_HOST : window.location.host,
      route = '/rdc/station-utils/stations-by-id/?ids=' + stationIds.filter((itm,ind)=>stationIds.indexOf(itm) === ind).sort().join(','), // filter out duplicates and then sort the items so that fastly will properly cache the result.
      url = protocol + '//' + host + route;

    return axios.get(url);
  }
};
