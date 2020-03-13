'use strict';

const _isEmpty = require('lodash/isEmpty'),
  { getAllStations } = require('../../station-utils'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils');

/**
 * returns the first station a user has access to.
 *
 * if the property is falsey or empty then return undefined
 *
 * @param {object} locals
 * @returns {Promise<object|undefined>}
 */
async function getFirstStationIHaveAccessTo(locals) {
  const { stationsIHaveAccessTo } = locals;

  if (_isEmpty(stationsIHaveAccessTo)) {
    return;
  }

  const firstSlug = Object.keys(stationsIHaveAccessTo)[0],
    stationBySlug = await getAllStations.bySlug({ locals });

  return stationBySlug[firstSlug];
}

/**
 * updates stationForPermissions to the station whose permission we need
 *   to check.
 *
 * this is useful because if the server was unable to determine a station for
 *   permissions based off the url then we still need to grab permissions for
 *   _a_ station.  This applies to server-side non-content components and other
 *   contexts which would require a lot of work in order to figure out the
 *   affected stations.
 *
 * this workaround works well enough because most users will be assigned a
 *   single role across a set of domains.  If a user happens to have multiple
 *   roles assigned to different domains, then grabbing the first station will
 *   return potentially incorrect results.
 *
 * one long term solution would be to associate page uris with each component.
 *   e.g. when you add or remove a component to a page, the component would have
 *   a property 'pagesAssociatedWith' which gets updated accordingly.
 *
 * @param {object} router - the express router
 */

module.exports = router => {
  router.use('/', wrapInTryCatch(async (_req, res, next) => {
    const { locals } = res;

    locals.stationForPermissions = locals.stationForPermissions
      || await getFirstStationIHaveAccessTo(locals)
      || {};

    next();
  }));
};
