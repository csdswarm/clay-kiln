'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  { getContestRules } = require('../../services/server/contest-rules');

module.exports = (router) => {
  router.get('/rdc/api/contest-rules', async (req, res) => {
    try {
      res.send(await getContestRules(req.query));
    } catch (err) {
      log('error', 'contest-rules api error', err);
      res.status(500)
        .send('issue retrieving contest-rules');
    }
  });

  return router;
};
