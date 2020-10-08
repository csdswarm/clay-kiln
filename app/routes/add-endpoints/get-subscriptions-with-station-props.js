'use strict';

const getSubscriptionsWithStationProps = require('../../services/server/get-subscriptions-with-station-props'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

module.exports = router => {
  router.post(
    '/rdc/get-subscriptions-with-station-props',
    wrapInTryCatch(async (req, res) => {
      const { data, locals } = req.body;

      if (!data || !locals) {
        res.status(400)
          .send("both 'data' and 'locals' must exist on the request body");
      } else {
        res.send(await getSubscriptionsWithStationProps(data, locals));
      }
    })
  );
};
