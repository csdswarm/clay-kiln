'use strict';

const publishing = require('../../services/publishing'),
  axios = require('../../node_modules/axios'),
  amphoraRender = require('../../node_modules/amphora/lib/render'),
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
  // { path: '/:dynamicStation/listen', dynamicPage: 'station' },
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

  // Full dynamic paths
  { path: '/:sectionFront' },
  { path: '/:sectionFront/:secondarySectionFront' },
  { path: '/:year/:month/:name' },
  { path: '/:year/:month/:day/:name' },

  // Station listen pages path
  withMiddleware(async (req, res, routeObject) => {
    const listenOnlyStations = await axios.get(`${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/_lists/listen-only-station-style`)
      .then((response) => response.data)
      .catch((error) => {
        console.log('An error occured getting the listen only station style list. \n ERROR: ', error);
      });

    console.log('Listen Only Stations: \n', listenOnlyStations);
    console.log('locals site slug: \n', res.locals.station.site_slug);

    const test = [
        {
          market: '',
          callsign: '',
          site_slug: 'q945'
        },
        {
          market: '',
          callsign: '',
          site_slug: 'q104'
        }
      ],

      // replace test with listenOnlyStations before pushing
      //
      //
      listenOnlySiteSlugs = test.map((station) => {
        return station.site_slug;
      });

    if (listenOnlySiteSlugs.includes(res.locals.station.site_slug)) {
      routeObject.dynamicPage = 'listenOnly';
    } else {
      routeObject.dynamicPage = 'station';
    };
    // const uri = res.req.uri;

    // console.log(amphoraRender)
    console.log('RESPONSE: \n', res);

    amphoraRender(req, res);
    console.log(routeObject.dynamicPage);

  }, {
    path: '/:dynamicStation/listen',
    dynamicPage: ''
  })
];

function withMiddleware(middlewareFn, routeObject) {
  const wrappedMiddleware = (req, res, routeObject) => {
    middlewareFn(req, res, routeObject);
  };

  routeObject.middleware = wrappedMiddleware;
  return routeObject;
};

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
