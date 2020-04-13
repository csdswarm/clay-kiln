'use strict';

const { wrapInTryCatch } = require('../middleware-utils'),
  axios = require('axios');

/**
 * Exposes an endpoint '/rdc/fetch-station-feeds' to actually fetch the information from the Frequency RSS Feed.
 *
 * 'rdc' here is a namespace convention defined previously to avoid collision with the domain of other teams.
 *
 * @param {object} router
 */

module.exports = router => {
  router.get('/rdc/etch-station-feeds', wrapInTryCatch(async (req, res) => {
    const { feedURL } = req.query,
      resp = await axios.get(`${feedURL}`);

    res.send(resp.data);
  }));
};
