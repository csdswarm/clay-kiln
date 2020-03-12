'use strict';

const
  _get = require('lodash/get'),
  { asInjectable } = require('../../services/universal/utils'),
  { retrieveList } = require('../../services/server/lists'),
  { STATION_AWARE_LISTS } = require('../../services/universal/constants'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),

  internals = () => ({
    retrieveList,
    STATION_AWARE_LISTS
  });

module.exports = asInjectable(internals, _ => router => {
  Object.keys(_.STATION_AWARE_LISTS)
    .forEach(listName => {
      router.get(`/_lists/${listName}`, wrapInTryCatch(async (req, res, next) => {

        const stationSlug = _get(res, 'locals.stationForPermissions.site_slug');

        if (!stationSlug) {
          return next();
        }

        return res.json(await _.retrieveList(listName, res.locals));
      }));
    });
});
