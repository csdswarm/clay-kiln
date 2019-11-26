'use strict';

const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  stationUtils = require('../../services/server/station-utils');

/**
 * Endpoint to expose a list of all callsigns plus NATL-RC to the client
 *   instead of relying on currentStation.js and locals
 * @param {object} router
 */
module.exports = router => {
  router.get('/all-rdc-callsigns', wrapInTryCatch(async (req, res) => {
    res.send(await stationUtils.getAllStationsCallsigns());
  }));
};
