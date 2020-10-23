'use strict';

const { wrapInTryCatch } = require('../middleware-utils'),
  db = require('../../server/db'),
  redis = require('../../server/redis');
  

module.exports = app => {
  app.use(wrapInTryCatch(async (req, res, next) => {
    const { station } = res.locals;

    let stationOptions = await redis.get(`station_options:${station.id}`);

    if (!stationOptions) {
      stationOptions = await db.get(`${process.env.CLAY_SITE_HOST}/_station_options/${station.id}`, res.locals, {});
      redis.set(`station_options:${station.id}`, JSON.stringify(stationOptions));
      res.locals.stationOptions = stationOptions;
      next();
    }

    res.locals.stationOptions = JSON.parse(stationOptions);
    next();
  }));
};