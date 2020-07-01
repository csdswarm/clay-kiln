'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = [
    '/_components/article/instances',
    '/_components/gallery/instances',
    '/_components/section-front/instances',
    '/_components/author-page-header/instances',
    '/_components/contest/instances',
    '/_components/event/instances',
    '/_components/events-listing-page/instances',
    '/_components/station-front/instances'
  ];

module.exports.routes = [
  // Partially static
  { path: '/authors/:author' },
  { path: '/:stationSlug/authors/:author' },
  { path: '/blogs/:author/:title' }, // Frequency URL pattern
  { path: '/blogs/:title' }, // Frequency URL pattern
  { path: '/articles/:author/:title' }, // Frequency URL pattern
  { path: '/articles/:title' }, // Frequency URL pattern
  { path: '/article/:name' },
  { path: '/music/article/:slug' },
  { path: '/news/article/:slug' },
  { path: '/sports/article/:slug' },
  { path: '/music/gallery/:slug' },
  { path: '/news/gallery/:slug' },
  { path: '/sports/gallery/:slug' },
  { path: '/topic/*' },
  { path: '/music/*' },
  { path: '/news/*' },
  { path: '/sports/*' },
  { path: '/:stationSlug/topic/*' },
  { path: '/:stationSlug/music/*' },
  { path: '/:stationSlug/news/*' },
  { path: '/:stationSlug/sports/*' },
  { path: '/newsletter/subscribe' },
  { path: '/news/small-business-pulse' },
  { path: '/small-business-pulse/:slug' },
  { path: '/small-business-pulse/:year/:month/:name' },
  { path: '/small-business-pulse/:year/:month/:day/:name' },
  { path: '/:stationSlug/:sectionFront/:secondarySectionFront/gallery/:slug' },
  { path: '/events/:slug' },
  // Paths above here that match dynamic paths will throw an error for missing before landing in the proper path
  { path: '/' },
  { path: '/:dynamicStation/listen', dynamicPage: 'station' },
  { path: '/stations', dynamicPage: 'stations-directory' },
  { path: '/stations/location', dynamicPage: 'stations-directory' },
  { path: '/stations/location/:dynamicMarket', dynamicPage: 'stations-directory' },
  { path: '/stations/music', dynamicPage: 'stations-directory' },
  { path: '/stations/music/:dynamicGenre', dynamicPage: 'stations-directory' },
  { path: '/stations/news-talk', dynamicPage: 'stations-directory' },
  { path: '/stations/sports', dynamicPage: 'stations-directory' },
  { path: '/account/:dynamicPage', dynamicPage: 'home'  },
  { path: '/account/:dynamicPage/:mode', dynamicPage: 'home' },
  { path: '/:stationSlug/topic/:dynamicTag', dynamicPage: 'topic' },
  { path: '/:stationSlug/music/:dynamicTag', dynamicPage: 'topic' },
  { path: '/:stationSlug/news/:dynamicTag', dynamicPage: 'topic' },
  { path: '/:stationSlug/sports/:dynamicTag', dynamicPage: 'topic' },
  { path: '/topic/:dynamicTag', dynamicPage: 'topic' },
  { path: '/music/:dynamicTag', dynamicPage: 'topic' },
  { path: '/news/:dynamicTag', dynamicPage: 'topic' },
  { path: '/sports/:dynamicTag', dynamicPage: 'topic' },
  { path: '/authors/:author', dynamicPage: 'author' },
  { path: '/:stationSlug/authors/:author', dynamicPage: 'author' },
  { path: '/contest-rules', dynamicPage: 'contest-rules-page' },
  { path: '/:stationSlug/contest-rules', dynamicPage: 'contest-rules-page' },
  { path: '/contests', dynamicPage: 'contest-rules-page' },
  { path: '/:stationSlug/contests', dynamicPage: 'contest-rules-page' },
  { path: '/contests/:slug' },
  { path: '/:stationSlug/shows/show-schedule', dynamicPage: 'frequency-iframe' },
  { path: '/:stationSlug/stats/:league/:scoreboard', dynamicPage: 'frequency-iframe' },

  // Full dynamic paths
  { path: '/:sectionFront' },
  { path: '/:sectionFront/:secondarySectionFront' },
  { path: '/:year/:month/:name' },
  { path: '/:year/:month/:day/:name' }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getEventSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getEventsListingUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getSectionFrontSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getContestSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getStationFrontSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getAuthorPageSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
