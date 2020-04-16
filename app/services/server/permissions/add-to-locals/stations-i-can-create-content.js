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
 * attaches a few properties when a user is logged in
 *   : stationsICanCreateSectionFronts
 *   : stationsICanCreateStaticPages
 *   : stationsICanCreateStationFronts
 *
 *   please see the note in cached-calls.js above 'getDomainNamesICanCreateSectionFronts'
 *   for an explanation on why these are necessary as a short-term solution
 *
 *   each object has the schema {
 *     [site_slug]: {TrimmedStation} - see ./utils for typedef
 *   }
 *
 * @param {object} router
 */
module.exports = router => {
  router.use('/', wrapInTryCatch(async (req, res, next) => {
    const { locals } = res;

    if (!shouldAddToLocals(locals) || isRefreshingPermissions(req)) {
      return next();
    }

    await Promise.all([
      loadStationsICanCreate('SectionFronts', locals, req),
      loadStationsICanCreate('StaticPages', locals, req),
      loadStationsICanCreate('StationFronts', locals, req)
    ]);

    next();
  }));
};

// helper functions

/**
 * loads the properties onto locals
 *
 * @param {string} name
 * @param {object} locals
 * @param {object} req
 */
async function loadStationsICanCreate(name, locals, req) {
  locals['stationsICanCreate' + name] = locals.user.provider === 'google'
    ? await getAllTrimmedStations(locals)
    : await getTrimmedStationsViaUrps(
      req,
      locals,
      urps.getDomainNamesICanImportContent
    );
}
