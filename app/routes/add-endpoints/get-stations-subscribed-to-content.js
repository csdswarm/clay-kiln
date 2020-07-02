'use strict';

const getStationsSubscribedToContent = require('../../services/server/get-stations-subscribed-to-content'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

module.exports = router => {
  router.post(
    '/rdc/get-stations-subscribed-to-content',
    wrapInTryCatch(async (req, res) => {
      const { data, locals } = req.body;

      if (!data || !locals) {
        res.status(400)
          .send("both 'data' and 'locals' must exist on the request body");
      } else {
        res.send(await getStationsSubscribedToContent(data, locals));
      }
    })
  );
};
