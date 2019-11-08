'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = [
    '/_components/article/instances',
    '/_components/gallery/instances',
    '/_components/section-front/instances',
    '/_components/author-page-header/instances'
  ],
  loadedIdsService = require('../../services/server/loaded-ids'),
  log = require('../../services/universal/log').setup({ file: __filename });

function getRoutes() {
  const initialRoutes = [
    // Partially static
    { path: '/authors/:author' },
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
    { path: '/topic/:tag' },
    { path: '/music/:tag' },
    { path: '/news/:tag' },
    { path: '/sports/:tag' },
    { path: '/newsletter/subscribe' },
    { path: '/news/small-business-pulse' },
    { path: '/small-business-pulse/:slug' },
    { path: '/small-business-pulse/:year/:month/:name' },
    { path: '/small-business-pulse/:year/:month/:day/:name' },
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
    { path: '/account/:dynamicPage/:mode', dynamicPage: 'home'  },
    { path: '/topic/:dynamicTag', dynamicPage: 'topic' },
    { path: '/music/:dynamicTag', dynamicPage: 'topic' },
    { path: '/news/:dynamicTag', dynamicPage: 'topic' },
    { path: '/sports/:dynamicTag', dynamicPage: 'topic' },
    { path: '/authors/:dynamicAuthor', dynamicPage: 'author' },
    // Full dynamic paths
    { path: '/:sectionFront' },
    { path: '/:sectionFront/:secondarySectionFront' },
    { path: '/:year/:month/:name' },
    { path: '/:year/:month/:day/:name' }
  ];

  // (for now) every route indicates a page for an end-user which means we
  //   should be clearing the 'loadedIds' for content deduping purposes.
  //   Outside  of these routes, loadedIds needs to stay in tact in case a
  //   'more-content-feed' component fires ajax calls that should be deduped
  //   etc.  It's important to note this middleware will only run on initial
  //   page requests from the browser (i.e. *not* from within the spa).  The spa
  //   only asks for the json which is handled in startup/canonical-json.js.
  //   That is why the LayoutRouter attaches the request
  //   header 'x-clear-loaded-ids'.
  //
  // 'middleware' is a routing option as seen by the code found here:
  //   https://github.com/clay/amphora/blob/v7.3.2/lib/services/attachRoutes.js#L92-L100
  return initialRoutes.map(route => {
    route.middleware = async (_req, res, next) => {
      const { locals } = res,
        // there may be a better way to do this, but the purpose here is to only
        //   clear the loaded ids when our full path is actually hit.  e.g. the
        //   middleware for '/' will run on all paths because amphora mounts it
        //   via `app.use('/'` instead of `app.use(/^\$/`.  Oddly enough the
        //   baseUrl for '/' ends up being an empty string hence the
        //   second condition.
        isMountedPath = _req.baseUrl === _req.originalUrl
          || (route.path === '/' && _req.originalUrl === '/');

      if (
        _req.method === 'GET'
        && isMountedPath
      ) {
        try {
          // rdcSessionID is instantiated in services/startup/add-rdc-redis-session.js
          await loadedIdsService.clear(locals.rdcSessionID);
          locals.loadedIds = [];
        } catch (err) {
          log('error', 'Error when deleting loadedIds from redis', err);
        }
      }

      next();
    };

    return route;
  });
}

module.exports.routes = getRoutes();

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getSectionFrontSlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getAuthorPageSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
