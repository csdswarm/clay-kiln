'use strict';

const db = require('../../services/server/db');
  

module.exports = app => {
  app.use(async (req, res, next) => {
    const { station } = res.locals,
      stationOptions = await db.get(`${process.env.CLAY_SITE_HOST}/_station_options/${station.id}`, res.locals, {});

    res.locals.stationOptions = stationOptions;
    next();
  });
};
