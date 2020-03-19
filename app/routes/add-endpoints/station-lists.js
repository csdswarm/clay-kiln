'use strict';

const
  _get = require('lodash/get'),
  { retrieveList } = require('../../services/server/lists'),
  { STATION_LISTS } = require('../../services/universal/constants'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),

  ix = {
    retrieveList,
    STATION_LISTS
  };

function stationLists(router) {
  return Object.keys(ix.STATION_LISTS)
    .forEach(listName => {
      router.get(`/_lists/${listName}`, wrapInTryCatch(async (req, res, next) => {

        const stationSlug = _get(res, 'locals.stationForPermissions.site_slug');

        if (!stationSlug) {
          return next();
        }

        return res.json(await ix.retrieveList(listName, { locals: res.locals }));
      }));
    });
}

stationLists.ix = ix;

module.exports = stationLists;

