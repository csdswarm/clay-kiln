'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = ['/_components/article/instances', '/_components/gallery/instances'],
  loadedIdsService = require('../../services/server/loaded-ids'),
  log = require('../../services/universal/log').setup({ file: __filename });

function getRoutes() {
  const initialRoutes = [
    { path: '/'},
    { path: '/:section'},
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
    { path: '/stations/sports', dynamicPage: 'stations-directory' }
  ];

  // (for now) every route indicates a page for an end-user which means we
  //   should be clearing the 'loadedIds' for content deduping purposes.
  //   Outside  of these routes, loadedIds needs to stay in tact in case a
  //   'more-content-feed' component fires ajax calls that should be deduped
  //   etc.  If we need to clear the loaded ids outside of that, then we can
  //   create an endpoint then.
  //
  // 'middleware' is a routing option as seen by the code found here:
  //   https://github.com/clay/amphora/blob/v7.3.2/lib/services/attachRoutes.js#L92-L100
  return initialRoutes.map(r => {
    r.middleware = async (_req, res, next) => {
      const { locals } = res;

      try {
        // rdcSessionID is instantiated in services/startup/add-rdc-redis-session.js
        await loadedIdsService.clearLoadedIds(locals.rdcSessionID);
        locals.loadedIds = [];
      } catch (err) {
        log('error', 'Error when deleting loadedIdsKey from redis', err);
      }

      next();
    };

    return r;
  });
}

module.exports.routes = getRoutes();

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getGallerySlugUrl(data, locals, mainComponentRefs),
  (uri, data, locals) => publishing.getArticleSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];

