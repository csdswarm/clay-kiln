'use strict';

const
  _get = require('lodash/get'),
  { addHiddenProperty } = require('../../services/universal/utils'),
  { retrieveList } = require('../../services/server/lists'),
  { STATION_LISTS } = require('../../services/universal/constants'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),

  __ = {
    retrieveList,
    STATION_LISTS
  };

module.exports = addHiddenProperty(router => Object.keys(__.STATION_LISTS)
  .forEach(listName => {
    router.get(`/_lists/${listName}`, wrapInTryCatch(async (req, res, next) => {

      const stationSlug = _get(res, 'locals.stationForPermissions.site_slug');

      if (!stationSlug) {
        return next();
      }

      return res.json(await __.retrieveList(listName, { locals: res.locals }));
    }));
  }), '__', __);

