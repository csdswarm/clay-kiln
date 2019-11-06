'use strict';

const { getComponentName } = require('clayutils'),
  { pageTypesToCheck } = require('../utils'),
  stationUtils = require('../../station-utils'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils');

module.exports = router => {
  router.post('/create-page', wrapInTryCatch(async (req, res, next) => {
    const { stationSlug } = req.body,
      { user } = res.locals,
      callsign = 'NATL-RC';

    if (stationSlug) {
      const stationsBySlug = await stationUtils.getAllStations.bySlug(),
        station = stationsBySlug[stationSlug];

      if (!station) {
        res.status(400)
          .send({ error: `no station found for slug '${stationSlug}'` });
        return;
      }

      callsign = station.attributes.callsign;
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
