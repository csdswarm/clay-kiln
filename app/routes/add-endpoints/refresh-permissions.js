'use strict';

const _get = require('lodash/get'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  urps = require('../../services/server/urps'),
  refreshPath = '/rdc/refresh-permissions';

module.exports = router => {
  router.get(refreshPath, wrapInTryCatch(async (req, res) => {
    const { provider } = _get(res, 'locals.user', {});

    if (provider !== 'cognito') {
      res.status(403);
      res.send('you must be logged into cognito for this endpoint to work');
      return;
    }

    await urps.refreshPermissions(req.session.auth);

    res.send('success');
  }));
};

Object.assign(module.exports, { refreshPath });
