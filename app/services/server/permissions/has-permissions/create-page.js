'use strict';

const { getComponentName } = require('clayutils'),
  { pageTypesToCheck } = require('../utils'),
  stationUtils = require('../../station-utils'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils');

/**
 * Checks whether the user has permissions to create the page they're attempting
 *   to create.
 *
 * @param {object} router - the userPermissionsRouter passed from permissions/index.js
 */
module.exports = router => {
  router.post('/create-page', wrapInTryCatch(async (req, res, next) => {
    const { stationSlug } = req.body,
      { locals } = res,
      { user } = locals;

    let callsign = 'NATL-RC';

    if (stationSlug) {
      const stationsBySlug = await stationUtils.getAllStations.bySlug({ locals }),
        station = stationsBySlug[stationSlug];

      if (!station) {
        res.status(400)
          .send({ error: `no station found for slug '${stationSlug}'` });
        return;
      }

      callsign = station.callsign;
    }

    // these shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const pageType = getComponentName(req.body.pageBody.main[0]),
      hasAccess = pageTypesToCheck.has(pageType)
        ? user.can('create').a(pageType).at(callsign).value
        : user.can('access').the('station').at(callsign).value;

    if (hasAccess) {
      next();
    } else {
      res.status(403);
      res.send({ error: 'Permission Denied' });
    }
  }));
};
