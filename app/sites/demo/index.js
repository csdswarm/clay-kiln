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
  { path: '/music/article/:slug' },
  { path: '/news/article/:slug' },
  { path: '/sports/article/:slug' },
  { path: '/music/gallery/:slug' },
  { path: '/news/gallery/:slug' },
  { path: '/sports/gallery/:slug' },
  { path: '/topic/:tag'},
  { path: '/music/:tag'},
  { path: '/news/:tag'},
  { path: '/sports/:tag'},
  { path: '/topic/:dynamicTag', dynamicPage: 'topic' },
  { path: '/music/:dynamicTag', dynamicPage: 'topic' },
  { path: '/news/:dynamicTag', dynamicPage: 'topic' },
  { path: '/sports/:dynamicTag', dynamicPage: 'topic' },
  { path: '/authors/:dynamicAuthor', dynamicPage: 'author' },
  { path: '/newsletter/subscribe' }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
