'use strict';

const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  urps = require('../../services/server/urps');

module.exports = (router, checkAuth) => {
  router.get('/rdc/refresh-permissions', checkAuth, wrapInTryCatch(async (req, res) => {
    const { provider } = res.locals.user;

    if (provider !== 'cognito') {
      res.status(400);
      res.send('you must be logged into cognito for this endpoint to work');
    }

    const auth = req.session.auth;

    auth.permissions = await urps.getAllPermissions(auth.token);
    res.send('success');
  }));
};
