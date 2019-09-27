'use strict';

const { getComponentName } = require('clayutils'),
  { pageTypesToCheck } = require('../utils'),
  stationUtils = require('../../station-utils');

module.exports = router => {
  router.post('/create-page', async (req, res, next) => {
    const { stationSlug } = req.body,
      { user } = res.locals;

    let callsign = 'NATL-RC';

    if (stationSlug) {
      const callsign = await stationUtils.getCallsignFromSlug(stationSlug);

      if (!callsign) {
        res.status(400);
        res.send({ error: `a station with site_slug '${stationSlug}' was not found` });
        return;
      }
    }

    // these shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const pageType = getComponentName(req.body.main[0]),
      hasAccess = pageTypesToCheck.has(pageType)
        ? user.can('create').a(pageType).at(callsign)
        : user.can('access').the('station').at(callsign);

    if (hasAccess) {
      next();
    } else {
      res.status(403);
      res.send({ error: 'Permission Denied' });
    }
  });
};
