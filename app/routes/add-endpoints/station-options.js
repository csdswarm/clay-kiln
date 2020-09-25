'use strict';

const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  _isEmpty = require('lodash/isEmpty'),
  db = require('../../services/server/db'),
  redis = require('../../services/server/redis');

module.exports = router => {
  router.put('/rdc/station-options/:id', wrapInTryCatch(async (req, res) => {
    const { body, params } = req;
    
    if (_isEmpty(body)) {
      return res.status(400).send('a request body is required');
    }

    await db.upsert(`${process.env.CLAY_SITE_HOST}/_station_options/${params.id}`, body);
    await redis.set(`station_options:${params.id}`, JSON.stringify(body));

    res.send(body);
  }));
};
