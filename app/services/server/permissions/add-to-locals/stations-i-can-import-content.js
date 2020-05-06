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
 * attaches the property 'stationsICanImportContent' when a user is logged in.
 *   this object is used both for checking permissions when importing content as
 *   well as displaying the list of stations in the import content kiln drawer.
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

    locals.stationsICanImportContent = locals.user.provider === 'google'
      ? await getAllTrimmedStations(locals)
      : await getTrimmedStationsViaUrps(
        req,
        locals,
        urps.getDomainNamesICanImportContent
      );

    next();
  }));
};
