'use strict';

const { wrapInTryCatch } = require('../middleware-utils'),
  axios = require('axios');

module.exports = router => {
  router.get('/rdc/fetch-station-feeds', wrapInTryCatch(async (req, res) => {
    const { feedURL } = req.query,
      resp = await axios.get(`${feedURL}`);
      
    console.log('DEBUG: API CALL______________PARAMS', feedURL);
    res.send(resp.data);
  }));
};
