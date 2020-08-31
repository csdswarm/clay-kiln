'use strict';

const { getAllStations } = require('../../station-utils'),
  { unityAppDomainName: unityApp } = require('../../../universal/urps'),
  { wrapInTryCatch } = require('../../../startup/middleware-utils');

/**
 * Middleware to determine whether a user has permissions to create or update
 *   an alert.
 *
 * TODO: the client should send stationSlug instead of callsign then utilize
 *   ./utils.js -> setStationForPermissions to both validate the station slug as
 *   well as have stationForPermissions available which will tidy up this logic
 *   a lot
 *
 * @param {string} action - either 'create' or 'update'
 * @returns {function} - middleware
 */
function createOrUpdateAlert(action) {
  return wrapInTryCatch(async (req, res, next) => {
    const callsign = req.body.station,
      { locals } = res,
      { user } = locals;

    let hasPermission,
      permissionMessage;

    if (callsign === 'GLOBAL') {
      hasPermission = user.can(action).a('global-alert').for(unityApp).value;
      permissionMessage = hasPermission.message;
    } else {
      const station = callsign === 'NATL-RC' ? locals.station : (await getAllStations({ locals })).byCallsign[callsign];

      if (!station) {
        res.status(400);
        res.send(`no station exists with the callsign '${callsign}'`);
        return;
      }

      hasPermission = !!locals.stationsIHaveAccessTo[station.site_slug];
      permissionMessage = `you don't have access to the station '${station.name} | ${station.callsign}'`;
    }

    if (hasPermission) {
      next();
    } else {
      res.status(403).send(permissionMessage);
    }
  });
}

module.exports = router => {
  router.post('/alerts', createOrUpdateAlert('create'));
  router.put('/alerts', createOrUpdateAlert('update'));
};
