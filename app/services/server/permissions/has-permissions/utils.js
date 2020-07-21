'use strict';

const stationUtils = require('../../station-utils'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  { DEFAULT_STATION } = require('../../../universal/constants'),
  rdcSlug = DEFAULT_STATION.site_slug;

/**
 * middleware that responds with a 400 error if the req.body.stationSlug
 *   is invalid
 *
 * if it's valid (empty defaults to rdc) then we set stationForPermissions to
 *   the associated station.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const setStationForPermissions = wrapInTryCatch(async (req, res, next) => {
  const { stationSlug = rdcSlug } = req.body,
    { locals } = res;

  let station = DEFAULT_STATION;

  if (stationSlug) {
    const stationsBySlug = await stationUtils.getAllStations.bySlug({ locals });

    station = stationsBySlug[stationSlug];

    if (!station) {
      res.status(400)
        .send({ error: `no station found for slug '${stationSlug}'` });
      return;
    }
  }

  locals.stationForPermissions = station;

  next();
});

module.exports = { setStationForPermissions };
