'use strict';
const radioApiService = require('../../../services/server/radioApi'),
  _isEmpty = require('lodash/isEmpty'),
  { wrapInTryCatch } = require('../../../services/startup/middleware-utils'),
  { getPodcastShow } = require('./podcast');
/**
  * fetch podcast show data
  * @param {object} locals
  * @param {string} dynamicEpisode
  * @returns {Promise<object>}
  */
const getPodcastEpisode = async (locals, dynamicEpisode) => {
    const route = `episodes?filter[episode_site_slug]=${ dynamicEpisode }`,
      { data } = await radioApiService.get(route, {}, null, {}, locals);

    if (_isEmpty(data)) {
      return {};
    }

    return data[0];
  },
  /**
    * fetch podcast show data
    * @param {object} req
    * @param {object} res
    * @param {object} next
    * @returns {Promise<object>}
    */
  episodeMiddleware = wrapInTryCatch(async ( req, res, next ) => {
    const { dynamicSlug, dynamicEpisode } = req.params,
      locals = res.locals,
      [ podcast, episode ] = await Promise.all([
        getPodcastShow(locals, dynamicSlug),
        getPodcastEpisode(locals, dynamicEpisode)
      ]);

    res.locals.podcast = podcast;
    res.locals.episode = episode;

    next();
  });

module.exports = {
  episodeMiddleware
};
