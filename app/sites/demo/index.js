'use strict';

const axios = require('../../node_modules/axios'),
  amphoraRender = require('../../node_modules/amphora/lib/render'),
  logger = require('../../services/universal/log'),
  { episode, podcast, dynamicPage } = require('./middleware'),
  publishing = require('../../services/publishing'),
  { topicPagePrefixes } = require('../../services/universal/constants');

const dynamicTopicRoutes = {
    national: topicPagePrefixes.map(prefix => ({
      path: `/${prefix}/:dynamicTag`,
      dynamicPage: 'topic'
    })),
    station: topicPagePrefixes.map(prefix => ({
      path: `/:stationSlug/${prefix}/:dynamicTag`,
      dynamicPage: 'topic'
    }))
  },
  log = logger.setup({ file: __filename }),
  mainComponentRefs = [
    '/_components/article/instances',
    '/_components/gallery/instances',
    '/_components/section-front/instances',
    '/_components/author-page-header/instances',
    '/_components/host-page-header/instances',
    '/_components/contest/instances',
    '/_components/event/instances',
    '/_components/events-listing-page/instances',
    '/_components/station-front/instances',
    '/_components/static-page/instances',
    '/_components/podcast-front-page/instances',
    '/_components/frequency-iframe-page/instances'
  ],
  staticTopicRoutes = {
    national: topicPagePrefixes.map(prefix => ({ path: `/${prefix}/*` })),
    station: topicPagePrefixes.map(prefix => ({
      path: `/:stationSlug/${prefix}/*`
    }))
  },
  routes = [
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
    ...staticTopicRoutes.national,
    ...staticTopicRoutes.station,
    { path: '/newsletter/subscribe' },
    { path: '/news/small-business-pulse' },
    { path: '/small-business-pulse/:slug' },
    { path: '/small-business-pulse/:year/:month/:name' },
    { path: '/small-business-pulse/:year/:month/:day/:name' },
    { path: '/:stationSlug/:sectionFront/:secondarySectionFront/gallery/:slug' },
    { path: '/events/:slug' },
    { path: '/hosts/:host' },
    { path: '/:stationSlug/hosts/:host' },
    // Paths above here that match dynamic paths will throw an error for missing before landing in the proper path
    { path: '/' },
    { path: '/:stationSlug/podcasts/:dynamicSlug', dynamicPage: 'podcast-show', middleware: podcast },
    { path: '/podcasts/:dynamicSlug', dynamicPage: 'podcast-show', middleware: [podcast] },
    { path: '/:stationSlug/podcasts/:dynamicSlug/:dynamicEpisode', dynamicPage: 'podcast-episode', middleware: episode },
    { path: '/podcasts/:dynamicSlug/:dynamicEpisode', dynamicPage: 'podcast-episode', middleware: episode },
    { path: '/stations', dynamicPage: 'stations-directory' },
    { path: '/stations/location', dynamicPage: 'stations-directory' },
    { path: '/stations/location/:dynamicMarket', dynamicPage: 'stations-directory' },
    { path: '/stations/music', dynamicPage: 'stations-directory' },
    { path: '/stations/music/:dynamicGenre', dynamicPage: 'stations-directory' },
    { path: '/stations/news-talk', dynamicPage: 'stations-directory' },
    { path: '/stations/sports', dynamicPage: 'stations-directory' },
    { path: '/account/:dynamicPage', dynamicPage: 'home'  },
    { path: '/account/:dynamicPage/:mode', dynamicPage: 'home' },
    ...dynamicTopicRoutes.station,
    ...dynamicTopicRoutes.national,
    { path: '/authors/:author', dynamicPage: 'author' },
    { path: '/:stationSlug/authors/:author', dynamicPage: 'author' },
    { path: '/contest-rules', dynamicPage: 'contest-rules-page' },
    { path: '/:stationSlug/contest-rules', dynamicPage: 'contest-rules-page' },
    { path: '/contests', dynamicPage: 'contest-rules-page' },
    { path: '/:stationSlug/contests', dynamicPage: 'contest-rules-page' },
    { path: '/contests/:slug' },
    { path: '/hosts/:host', dynamicPage: 'host' },
    { path: '/:stationSlug/hosts/:host', dynamicPage: 'host' },
    { path: '/:stationSlug/shows/show-schedule', dynamicPage: 'frequency-iframe-page' },
    { path: '/:stationSlug/stats/:league/:scoreboard', dynamicPage: 'frequency-iframe-page' },
    { path: '/:stationSlug/stats/:league/:standings', dynamicPage: 'frequency-iframe-page' },

    // Full dynamic paths
    { path: '/:sectionFront' },
    { path: '/:sectionFront/:secondarySectionFront' },
    { path: '/:year/:month/:name' },
    { path: '/:year/:month/:day/:name' },

    // Station listen path
    {
      path: '/:dynamicStation/listen',
      middleware: async (req, res ) => {
        try {
          // Retrieve all listen only stations from the database,
          // filter the results, and return the correct page reference as page.
          const page = await axios.get(`${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/_lists/listen-only-station-style`)
              .then((response) => {
                const listenOnlyStationSlugs = response.data.map((station) => {
                  return station.siteSlug;
                });

                if (listenOnlyStationSlugs.includes(res.locals.station.site_slug)) {
                  return 'station-detail-listen-only';
                } else {
                  return 'station';
                };
              }),
            showPublished = !res.locals.edit;

          // It is not possible to modify dynamicPage through amphora's middleware property
          // as the dynamicPage is already defined on the route when the route is added through amphora.
          // Refer to: app/node_modules/amphora/lib/services/attachRoutes.js line 91. parseHandler().
          // We directly use amphora's renderPage() to correctly render the corresponding page reference.
          // Refer to: app/node_modules/amphora/lib/render.js line 111. renderPage().
          amphoraRender.renderPage(`${res.locals.site.host}/_pages/${page}${showPublished ? '@published' : ''}`, req, res, process.hrtime());

        } catch (error) {
          log('An error occured getting the listen only station style list. \n ERROR: ', error);

          res.status(404);
          res.send('Could not render dynamic page.');
        };

      }
    }

  ];

// Add dynamicPage middleware to all dynamic pages.
routes.map((route) => {
  const isDynamic = route.hasOwnProperty('dynamicPage'),
    hasMiddleware = route.hasOwnProperty('middleware'),
    middlwareIsArray = Array.isArray(route.middleware);

  if (isDynamic && hasMiddleware) {
    middlwareIsArray ? route.middleware.push(dynamicPage) : route.middleware = [route.middleware, dynamicPage];
  } else if (isDynamic) {
    route.middleware = dynamicPage;
  };

});

module.exports.routes = routes;

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getStaticPageSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getEventSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getEventsListingUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getSectionFrontSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getContestSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getStationFrontSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getAuthorPageSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getHostPageSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getPodcastFrontSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
