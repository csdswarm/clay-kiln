'use strict';

const getS3StationFeedImgUrl = require('../../server/get-s3-station-feed-img-url'),
  { wrapInTryCatch } = require('../middleware-utils');

module.exports = router => {
  router.get('/rdc/s3-station-feed-img-url', wrapInTryCatch(async (req, res) => {
    const { url } = req.query;

    if (!url) {
      res.status(400).send("query param 'url' is required");
      return;
    }

    res.send(await getS3StationFeedImgUrl(url));
  }));
};
