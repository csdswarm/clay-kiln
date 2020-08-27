'use strict';

const _isEmpty = require('lodash/isEmpty'),
  _sortedUniq = require('lodash/sortedUniq'), // use the optimized version of _.uniq because we're sorting the lists anyway
  axios = require('axios');

module.exports = {
  /**
   * Gets station data for a provided list of stations
   * @param {[string|number]} stationIds A list of station IDs
   * @returns {Promise<[object]>}
   */
  getSomeStations:{
    byId:async ({ ids }) => {
      if (_isEmpty(ids))
        return {};
      const route = '/rdc/station-utils/stations-by-id/?ids=' + _sortedUniq(ids.sort()).join(','), // sort the items and filter out duplicates so that fastly will properly cache the result.
        { data } = await axios.get(route);

      return data;
    }
  }
};
