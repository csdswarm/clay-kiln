'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = ['/_components/article/instances'];

module.exports.routes = [
  { path: '/'},
  { path: '/:section'},
  { path: '/:year/:month/:name' },
  { path: '/article/:name' },
  { path: '/tags/:tag.html', dynamicPage: 'tag' }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
