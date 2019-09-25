'use strict';

const radioApiService = require('../../radioApi'),
  _get = require('lodash/get'),
  { getComponentName } = require('clayutils'),
  { pageTypesToCheck } = require('../utils'),
  /**
   * Finds the station callsign from the slug
   *
   * @param {string} slug
   * @returns {string}
   */
  getCallsignFromStationSlug = async slug => {
    const response = await radioApiService.get('stations', { page: { size: 1000 } }),
      stationFound = response.data.find(aStation => {
        return aStation.attributes.site_slug === slug;
      });

    return _get(stationFound, 'attributes.callsign');
  };

module.exports = router => {
  router.post('/create-page', async (req, res, next) => {
    const { stationSlug } = req.body,
      { user } = res.locals;

    let callsign = 'NATL-RC';

    if (stationSlug) {
      const callsign = await getCallsignFromStationSlug(stationSlug);

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
