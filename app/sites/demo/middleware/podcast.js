'use strict';
const { getPodcastShow } = require('../../../services/universal/podcast'),
  { wrapInTryCatch } = require('../../../services/startup/middleware-utils'),
  _isEmpty = require('lodash/isEmpty');

/**
* adds 'podcast' onto locals.
* @param {object} req
* @param {object} res
* @param {object} next
* @returns {Promise<object>}
*/
const podcastMiddleware = wrapInTryCatch(async ( req, res, next ) => {
  const { dynamicSlug } = req.params,
    locals = res.locals,
    podcastShow = await getPodcastShow(locals, dynamicSlug);

  if (_isEmpty(podcastShow)) {
    res.status(404).send('Podcast not found');
  } else {
    res.locals.podcast = podcastShow;
    next();
  }
});

module.exports = {
  podcastMiddleware
};
