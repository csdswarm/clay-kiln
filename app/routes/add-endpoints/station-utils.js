'use strict';

const _memoize = require('lodash/memoize'),
  stationUtils = require('../../services/server/station-utils'),
  getStationsById = _memoize(stationUtils.getAllStations.byId, ()=>'byId');

/**
 * Add routes for station utils
 *
 * @param {object} router
 */
module.exports = router => {
  /**
   * Get a list of specific stations data given a comma-separated list of station IDs
   */
  router.get('/station-utils/stations-by-id/:stationIds', async (req, res) => {
    const allStationsById = await getStationsById({ locals: res.locals }),
      { stationIds } = req.params,
      result = stationIds.split(',').map(stationId => {
        return allStationsById[stationId];
      });

    res.status(200).send(result);
  });
};
