'use strict';

const { getComponentName } = require('clayutils'),
  { pageTypesToCheck } = require('../utils'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  { setStationForPermissions } = require('./utils');

/**
 * Checks whether the user has permissions to create the page they're attempting
 *   to create.
 *
 * @param {object} router - the userPermissionsRouter passed from permissions/index.js
 */
module.exports = router => {
  router.post(
    '/create-page',
    setStationForPermissions,
    wrapInTryCatch(async (req, res, next) => {
      const { locals } = res,
        { stationForPermissions, user } = locals;

      // these shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const pageType = getComponentName(req.body.pageBody.main[0]),
        hasAccess = pageTypesToCheck.has(pageType)
          ? user.can('create').a(pageType).value
          : !!locals.stationsIHaveAccessTo[stationForPermissions.site_slug];

      if (hasAccess) {
        next();
      } else {
        res.status(403);
        res.send({ error: 'Permission Denied' });
      }
    })
  );
};
