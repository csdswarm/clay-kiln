'use strict';

const { rendererPipeline } = require('./utils'),
  redis = require('../../services/server/redis'),
  { redisKey } = require('../../services/universal/msn-feed-utils'),
  { urlToElasticSearch } = require('../../services/universal/utils');

/**
 * Run the feed instance through the transform
 * that is specified in its data. Then consolidate
 * so it can be sent to the renderer.
 *
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise}
 */
module.exports = (ref, data, locals) => {
  const urls = data.results.map(entry => urlToElasticSearch(entry.canonicalUrl));

  redis.set(redisKey.urlsLastQueried, JSON.stringify(urls));

  return rendererPipeline(ref, data, locals, 'msn');
};
