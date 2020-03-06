'use strict';

const { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  { setStationForPermissions } = require('./utils');

/**
 * Checks whether the user has permissions to create the page they're attempting
 *   to create.
 *
 * @param {object} router - the userPermissionsRouter passed from permissions/index.js
 */
module.exports = router => {
  router.post(
    '/import-content',
    setStationForPermissions,
    wrapInTryCatch(async (req, res, next) => {
      const { locals } = res,
        { stationForPermissions } = locals,
        slug = stationForPermissions.site_slug;

      // these shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const hasAccess = !!locals.stationsICanImportContent[slug];

      if (hasAccess) {
        next();
      } else {
        res.status(403);
        res.send({ error: 'Permission Denied' });
      }
    })
  );
};
