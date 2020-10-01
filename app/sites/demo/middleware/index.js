'use strict';

const { episodeMiddleware } = require('./episode'),
  { podcastMiddleware } = require('./podcast'),
  { dynamicPageMiddleware } = require('./dynamicPage');

module.exports = {
  episodeMiddleware,
  podcastMiddleware,
  dynamicPageMiddleware
};
