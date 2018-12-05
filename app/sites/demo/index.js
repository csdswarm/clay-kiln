'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = ['/_components/article/instances'];

module.exports.routes = [
  { path: '/'},
  { path: '/:section'},
  { path: '/blogs/:author/:title'}, // Frequency URL pattern
  { path: '/blogs/:title'}, // Frequency URL pattern
  { path: '/articles/:author/:title'}, // Frequency URL pattern
  { path: '/articles/:title'}, // Frequency URL pattern
  { path: '/:year/:month/:name' },
  { path: '/article/:name' },
  { path: '/tag/:tag'},
  { path: '/tag/:dynamicTag', dynamicPage: 'tag' },
  { path: '/syndicated-authors/:dynamicAuthor', dynamicPage: 'author' }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
