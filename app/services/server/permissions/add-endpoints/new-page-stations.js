'use strict';

const _ = require('lodash'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  stationUtils = require('../../station-utils');

/**
 * Adds GET 'new-page-stations' so kiln has a list of stations to select from
 *
 * The endpoint returns an object of site slug to station name and callsign for
 *   each of the stations a user has access to.
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/new-page-stations', wrapInTryCatch(async (req, res) => {
    const stationsIHaveAccessTo = Object.keys(res.locals.permissions.station.access.station),
      stationsByCallsign = await stationUtils.getAllStations.byCallsign(),
      slugToName = _.chain(stationsByCallsign)
        .pick(stationsIHaveAccessTo)
        .mapKeys('attributes.site_slug')
        .mapValues(aStation => ({
          callsign: aStation.attributes.callsign,
          name: aStation.attributes.name
        }))
        .value();

    // stationsByCallsign won't have NATL-RC because it's not an actual station
    if (stationsIHaveAccessTo.includes('NATL-RC')) {
      Object.assign(slugToName, {
        // the national station doesn't have a slug
        '': {
          callsign: 'NATL-RC',
          name: 'National'
        }
      });
    }

    res.send(slugToName);
  }));
};
