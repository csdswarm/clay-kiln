'use strict';
const { getPodcastShow } = require('../../../services/server/podcast'),
  { wrapInTryCatch } = require('../../../services/startup/middleware-utils');

/**
* adds 'podcast' onto locals.
* @param {object} req
* @param {object} res
* @param {object} next
* @returns {Promise<object>}
*/
const podcastMiddleware = wrapInTryCatch(async ( req, res, next ) => {
  const { dynamicSlug } = req.params,
    locals = res.locals;

  res.locals.podcast = await getPodcastShow(locals, dynamicSlug);

  next();
});

module.exports = {
  podcastMiddleware
};
