'use strict';

const stationUtils = require('../../services/server/station-utils');

/**
 * Add routes for station utils
 *
 * @param {object} router
 */
module.exports = router => {
  /**
   * Get a list of specific stations data given a comma-separated list of station IDs
   * example: "/rdc/station-utils/stations-by-id?ids=15,409,447,453
   * ids can be in any order or contain duplicates, but for best results (i.e. properly using cache) ids should be ordered lowest->highest with no duplicates
   */
  router.get('/rdc/station-utils/stations-by-id', async (req, res) => {
    const stationsById = await stationUtils.getSomeStations.byId({ locals: res.locals, ids: req.query.ids.split(',') });

    res.status(200).send(stationsById);
  });
};