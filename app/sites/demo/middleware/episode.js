'use strict';
const { wrapInTryCatch } = require('../../../services/startup/middleware-utils'),
  podcasts = require('../../../services/universal/podcast');

/**
  * adds 'episode' and 'podcast' onto locals.
  * @param {object} req
  * @param {object} res
  * @param {object} next
  * @returns {Promise<object>}
  */
const episode = wrapInTryCatch(async ( req, res, next ) => {
  const { dynamicSlug, dynamicEpisode } = req.params,
    locals = res.locals,
    [ podcast, episode ] = await Promise.all([
      podcasts.getPodcastShow(locals, dynamicSlug),
      podcasts.getPodcastEpisode(locals, dynamicEpisode)
    ]);

  res.locals.podcast = podcast;
  res.locals.episode = episode;

  next();
});

module.exports = {
  episode
};
