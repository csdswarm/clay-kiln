'use strict';

const publishing = require('../../services/publishing'),
  middleware = require('./middleware'),
  mainComponentRefs = ['/_components/article/instances', '/_components/gallery/instances', '/_components/section-front/instances'];

module.exports.routes = [
  { path: '/', middleware },
  { path: '/:sectionFront'},
  { path: '/:sectionFront/:secondarySectionFront'},
  { path: '/blogs/:author/:title'}, // Frequency URL pattern
  { path: '/blogs/:title'}, // Frequency URL pattern
  { path: '/articles/:author/:title'}, // Frequency URL pattern
  { path: '/articles/:title'}, // Frequency URL pattern
  { path: '/:year/:month/:name' },
  { path: '/:year/:month/:day/:name' },
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
  { path: '/newsletter/subscribe' },
  { path: '/news/small-business-pulse' },
  { path: '/small-business-pulse/:slug' },
  { path: '/small-business-pulse/:year/:month/:name' },
  { path: '/small-business-pulse/:year/:month/:day/:name' },
  { path: '/:dynamicStation/listen', dynamicPage: 'station' },
  { path: '/stations', dynamicPage: 'stations-directory' },
  { path: '/stations/location', dynamicPage: 'stations-directory' },
  { path: '/stations/location/:dynamicMarket', dynamicPage: 'stations-directory' },
  { path: '/stations/music', dynamicPage: 'stations-directory' },
  { path: '/stations/music/:dynamicGenre', dynamicPage: 'stations-directory' },
  { path: '/stations/news-talk', dynamicPage: 'stations-directory' },
  { path: '/stations/sports', dynamicPage: 'stations-directory' },
  { path: '/account/:dynamicPage', dynamicPage: 'home'  },
  { path: '/account/:dynamicPage/:mode', dynamicPage: 'home'  }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getSectionFrontSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
