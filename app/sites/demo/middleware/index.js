'use strict';

const { episodeMiddleware } = require('./episode'),
  { podcastMiddleware } = require('./podcast');

module.exports = {
  episodeMiddleware,
  podcastMiddleware
};
