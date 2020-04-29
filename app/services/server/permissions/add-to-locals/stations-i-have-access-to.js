'use strict';

const { wrapInTryCatch } = require('../../../startup/middleware-utils'),
  urps = require('../../urps'),
  {
    getAllTrimmedStations,
    getTrimmedStationsViaUrps,
    isRefreshingPermissions,
    shouldAddToLocals
  } = require('./utils');

/**
 * attaches the property 'stationsIHaveAccessTo' when a user is logged in.  This
 *   object is used for checking station access permissions as well as showing
 *   a user a list of stations to choose from when doing things such as
 *   creating content.
 *
 * the object has the schema {
 *   [site_slug]: {TrimmedStation} - see ./utils for typedef
 * }
 *
 * @param {object} router
 */
module.exports = router => {
  router.use('/', wrapInTryCatch(async (req, res, next) => {
    const { locals } = res;

    if (!shouldAddToLocals(locals) || isRefreshingPermissions(req)) {
      return next();
    }

    locals.stationsIHaveAccessTo = locals.user.provider === 'google'
      ? await getAllTrimmedStations(locals)
      : await getTrimmedStationsViaUrps(
        req,
        locals,
        urps.getDomainNamesIHaveAccessTo
      );

    next();
  }));
};
