'use strict';

const { updatePodcasts } = require('../../services/server/podcasts'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

/**
 * adds the POST '/update-db-podcasts' endpoint
 *
 * this authenticated endpoint updates podcasts stored in DB
 *
 * @param {object} router
 * @param {function} checkAuth
 */
module.exports = (router, checkAuth) => {
  router.post('/update-db-podcasts', checkAuth, wrapInTryCatch(async (req, res) => {
    await updatePodcasts();
    res.status(200).send('podcasts in DB updated');
  }));
};
