'use strict';

const { DEFAULT_STATION } = require('../../../universal/constants'),
  getContentSubcriptions = require('../../get-content-subscriptions');

module.exports = router => {
  router.get('/*', async (req, res, next) => {
    const { locals } = res,
      { edit, stationForPermissions } = locals;

    if (edit && stationForPermissions !== DEFAULT_STATION) {
      locals.contentSubscriptions = await getContentSubcriptions.byStationSlug(stationForPermissions.site_slug);
    }

    next();
  });
};
