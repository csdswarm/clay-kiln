'use strict';

const assignStationsToLocals = require('./assign-stations-to-locals'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  stationUtils = require('../../server/station-utils'),
  { wrapInTryCatch } = require('../middleware-utils'),
  logger = require('../../universal/log'),

  log = logger.setup({ file: __filename });


stationUtils.getAllStations({ locals: { } })
  .then(() => log('error', 'API Station Data Warmed (Info Log)'))
  .catch(err => log('error', err));

/**
 * obtain the current station details and store them for all components to access in locals
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = wrapInTryCatch(async (req, res, next) => {
  const { locals } = res,
    allStations = await stationUtils.getAllStations({ locals });

  await assignStationsToLocals(locals, req, allStations);

  Object.assign(locals, {
    allStationsCallsigns: Object.keys(allStations.byCallsign),
    defaultStation: DEFAULT_STATION
  });

  return next();
});
