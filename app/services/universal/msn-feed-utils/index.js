'use strict';

const _mapValues = require('lodash/mapValues'),
  { prepend } = require('../utils'),
  redisKey = _mapValues(
    {
      lastModified: 'last-modified',
      // we could use article ids instead of canonicalUrls but then we'd have to
      //   use a raw query or update the query service to support returning ids.
      //   Using urls is easy and should be functionally equivalent.
      urlsLastQueried: 'urls-last-queried'
    },
    prepend('msn-feed:')
  );

module.exports = {
  articleWillShowOnMsnFeed: require('./article-will-show-on-msn-feed'),
  getComputedImageProps: require('./get-computed-image-props'),
  redisKey
};
