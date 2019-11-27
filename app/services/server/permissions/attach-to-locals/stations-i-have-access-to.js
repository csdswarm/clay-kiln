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
    const { locals } = res,
      stationAccessPerms = _.get(res, 'locals.permissions.station.access.station');

    if (!locals.edit) {
      return next();
    }

    if (!stationAccessPerms) {
      locals.stationsIHaveAccessTo = {};
      return next();
    }

    // these shouldn't be declared above the short circuits
    // eslint-disable-next-line one-var
    const callsignsIHaveAccessTo = Object.keys(stationAccessPerms),
      stationsByCallsign = await stationUtils.getAllStations.byCallsign({ locals }),
      stationsBySlug = _.chain(stationsByCallsign)
        .pick(callsignsIHaveAccessTo)
        .mapKeys('site_slug')
        .mapValues(({ callsign, name, site_slug }) => {
          return {
            callsign,
            name,
            slug: site_slug
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
