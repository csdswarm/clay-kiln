'use strict';

const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  getImageInfo = require('../../services/server/get-image-info');

/**
 * adds the GET '/image-info' endpoint
 *
 * this authenticated endpoint takes a required query parameter 'url' which is
 *   assumed to point to an image.  It returns the result of the
 *   getImageInfo utility.
 *
 * the reason this endpoint is authenticated is that it makes calls to third
 *   party websites and is only currently necessary for server-side usage and
 *   kiln's edit mode.
 *
 * @param {object} router
 * @param {function} checkAuth
 */
module.exports = (router, checkAuth) => {
  router.get('/image-info', checkAuth, wrapInTryCatch(async (req, res) => {
    const { url } = req.query;

    if (!url) {
      res.status(400)
        .send({ error: "the query parameter 'url' is required" });

      return;
    }

    const result = await getImageInfo(url);

    if (result.is404) {
      res.status(404).end();
      return;
    } else {
      res.send(result);
    }
  }));
};
