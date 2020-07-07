'use strict';

const { DEFAULT_STATION } = require('../../../universal/constants'),
  getNationalSubcriptions = require('../../get-national-subscriptions');

module.exports = router => {
  router.get('/*', async (req, res, next) => {
    const { locals } = res,
      { edit, stationForPermissions } = locals;

    if (edit && stationForPermissions !== DEFAULT_STATION) {
      locals.nationalSubscriptions = await getNationalSubcriptions.byStationSlug(stationForPermissions.site_slug);
    }

    next();
  });
};
