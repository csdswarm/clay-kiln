'use strict';

const _ = require('lodash'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  stationUtils = require('../../station-utils');

/**
 * attaches the property 'callsignsIHaveAccessTo' during edit mode.  It is used
 *   by kiln plugins which allow the user to select a station.
 *
 * The object has the schema {
 *   [site_slug]: {
 *     callsign: string
 *     name: string
 *     slug: string (site_slug)
 *   }
 * }
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/*', wrapInTryCatch(async (req, res, next) => {
    // this is only meant for kiln, so if we're not editing then we don't
    //   need it
    if (!res.locals.edit) {
      return next();
    }

    const callsignsIHaveAccessTo = Object.keys(res.locals.permissions.station.access.station),
      stationsByCallsign = await stationUtils.getAllStations.byCallsign(),
      stationsBySlug = _.chain(stationsByCallsign)
        .pick(callsignsIHaveAccessTo)
        .mapKeys('attributes.site_slug')
        .mapValues(aStation => {
          const { attributes: attr } = aStation;

          return {
            callsign: attr.callsign,
            name: attr.name,
            slug: attr.site_slug
          };
        })
        .value();

    // stationsByCallsign won't have NATL-RC because it's not an actual station
    if (callsignsIHaveAccessTo.includes('NATL-RC')) {
      Object.assign(stationsBySlug, {
        // the national station doesn't have a slug
        '': {
          callsign: 'NATL-RC',
          name: 'Radio.com',
          slug: ''
        }
      });
    }

    res.locals.stationsIHaveAccessTo = stationsBySlug;

    next();
  }));
};
