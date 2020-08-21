'use strict';

const _ = require('lodash'),
  url = require('url'),
  db = require('../server/db'),
  buffer = require('../server/buffer'),
  { sites, composer } = require('amphora'),
  log = require('../universal/log').setup({ file: __filename });

/**
 * Pulled from inside Amphora to fake locals
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params
 */
function fakeLocals(req, res, params) {
  _.each(sites.sites(), site => {
    res.locals.url = db.uriToUrl(req.hostname + req.originalUrl, { site });
    res.locals.site = site;
    res.locals.params = params;
  });
}

/**
 * Get approriate routePrefix and routeParamKey from req.path
 *
 * @param {string} path
 * @returns {Object}
 */
function getPrefixAndKey(path) {
  const authorRoute = (new RegExp('^\\/authors\\/')).test(path),
    routePrefix = authorRoute ? 'author' : 'topic',
    routeParamKey = authorRoute ? 'author' : 'tag';

  return { routeParamKey, routePrefix };
}

const routes = [
  // `/authors/{authorSlug}` or `{stationSlug}/authors/{authorSlug}`
  // https://regex101.com/r/TFNbVH/1
  {
    testPath: req => {
      const { pathname } = url.parse(req.url);

      return !!pathname.match(/([\w\-]+)?\/authors\/?([\w\-]+)+$/);
    },
    getParams: (req, params) => {
      const { pathname } = url.parse(req.url),
        [ , stationSlug, author ] = pathname.match(/([\w\-]+)?\/authors\/?([\w\-]+)+$/);

      if (stationSlug) {
        params.stationSlug = stationSlug;
      }
      if (author) {
        params.author = author;
      }
    },
    getPageData: req => curatedOrDynamicRouteHandler(req, 'author')
  },
  { // stations directories
    testPath: req => req.path.includes('/stations'),
    getParams: (req, params) => {
      if (req.path.match(/stations\/location\/(.+)/)) {
        params.dynamicMarket = req.path.match(/stations\/location\/(.+)/)[1];
      } else if (req.path.match(/stations\/music\/(.+)/)) {
        params.dynamicGenre = req.path.match(/stations\/music\/(.+)/)[1];
      }
    },
    getPageData: req => db.get(`${req.hostname}/_pages/stations-directory@published`)
  },
  { // station detail page
    testPath: req => /\/(.+)\/listen$/.test(req.path),
    getParams: (req, params) => params.dynamicStation = req.path.match(/\/(.+)\/listen$/)[1],
    getPageData: req => db.get(`${req.hostname}/_pages/station@published`)
  },
  { // podcast show page - https://regex101.com/r/cjCzbC/6
    testPath: req => /\/?([\w\-]+)?\/podcasts\/?([\w\-]+)\/?$/.test(req.path),
    getParams: (req, params) => {
      const matches = req.path.match(/\/?([\w\-]+)?\/podcasts\/?([\w\-]+)\/?$/);

      params.stationSlug = matches[1];
      params.dynamicSlug = matches[2];
    },
    getPageData: req => db.get(`${req.hostname}/_pages/podcast-show@published`)
  },
  { // podcast episode page - https://regex101.com/r/cjCzbC/4
    testPath: req => /\/?([\w\-]+)?\/podcasts\/([\w\-]+)\/([\w\-]+)/.test(req.path),
    getParams: (req, params) => {
      const matches = req.path.match(/\/?([\w\-]+)?\/podcasts\/([\w\-]+)\/([\w\-]+)/);

      params.stationSlug = matches[1];
      params.dynamicSlug = matches[2];
      params.dynamicEpisode = matches[3];
    },
    getPageData: req => db.get(`${req.hostname}/_pages/podcast-episode@published`)
  },
  // `/contest-rules` or `{stationSlug}/contest-rules`
  {
    testPath: req => {
      const { pathname } = url.parse(req.url),
        basePath = 'contest-rules',
        pathnameIndex = parsePathParts(pathname)
          .indexOf(basePath);

      return pathnameIndex === 0
        || pathnameIndex === 1;
    },
    getParams: (req, params) => {
      const { pathname } = url.parse(req.url),
        match = pathname.match(/\/(.+)\/contest-rules/);

      params.stationSlug = match ? match[1] : '';
    },
    getPageData: req => db.get(`${req.hostname}/_pages/contest-rules-page@published`)
  },
  // `/contests` or `{stationSlug}/contests`
  {
    testPath: req => {
      const { pathname } = url.parse(req.url),
        basePath = 'contests',
        pathParts = parsePathParts(pathname),
        pathnameIndex = pathParts
          .indexOf(basePath),
        // `/contests/{slug}` or `{stationSlug}/contests/{slug}`
        isContestPage = /\/contests\/(.+)/.test(pathname);

      if (isContestPage) {
        return false;
      }

      return pathnameIndex === 0
        || pathnameIndex === 1;
    },
    getParams: (req, params) => {
      const { pathname } = url.parse(req.url),
        match = pathname.match(/\/(.+)\/contests/);

      params.stationSlug = match ? match[1] : '';
    },
    getPageData: req => db.get(`${req.hostname}/_pages/contest-rules-page@published`)
  },
  // `{stationSlug}/shows/show-schedule`
  {
    testPath: req => req.path.includes('/shows/show-schedule'),
    getParams: (req, params) => {
      const { pathname } = url.parse(req.url),
        match = pathname.match(/\/(.+)\/shows/);

      params.stationSlug = match ? match[1] : '';
    },
    getPageData: req => db.get(`${req.hostname}/_pages/frequency-iframe-page@published`)
  },
  // `{stationSlug}/stats/mlb/scores`
  {
    testPath: req => req.path.includes('/stats'),
    getParams: (req, params) => {
      const { pathname } = url.parse(req.url),
        match = pathname.match(/\/(.+)\/stats/);

      params.stationSlug = match ? match[1] : '';
    },
    getPageData: req => db.get(`${req.hostname}/_pages/frequency-iframe-page@published`)
  },
  { // [default route handler] resolve the uri and page instance
    testPath: () => true,
    getParams: () => {},
    getPageData: req => db
      .getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`)
      .then(data => db.get(`${data}@published`))
  }
];

/**
 * Returns the pathname split into an array of parts.
 *
 * Example:
 * ```
 * const pathname = '/foo/bar/blah'
 * pathParts(pathname) // ['foo', 'bar', 'blah']
 * ```
 *
 * @param {string} pathname
 * @returns {Array<string>}
 */
function parsePathParts(pathname) {
  return pathname.match(/[^\/]+/g) || [];
}
/**
  * Returns curated or dynamic page data
  *
  * @param {Object} req
  * @param {string} dynamicPageKey
  * @returns {Promise<Promise<Object>>}
*/
function curatedOrDynamicRouteHandler(req, dynamicPageKey) {
  return db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`)
    .then(pageKey => db.get(`${ pageKey }@published`))
    .catch(() => db.get(`${ req.hostname }/_pages/${ dynamicPageKey }@published`));
}

/**
 * If you add the `X-Amphora-Page-JSON` header to a request
 * to a canonical url you can grab the page's JSON.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise}
 */
async function middleware(req, res, next) {
  const params = {},
    { routeParamKey, routePrefix } = getPrefixAndKey(req.path);

  let promise, dynamicParamExtractor;

  if (req.method !== 'GET' || !req.headers['x-amphora-page-json']) {
    return next();
  }

  // Define Curated/Dynamic routes.
  // Match against section-front, topic, and author slug prefixes
  const sectionFrontsList = '/_lists/primary-section-fronts',
    sectionFronts = await db.get(`${ req.hostname }${ sectionFrontsList }`),
    sectionFrontValues = sectionFronts.map(sectionFront => sectionFront.value),
    curatedOrDynamicRoutePrefixes = [
      ...sectionFrontValues,
      'topic',
      'authors'
    ],
    curatedOrDynamicRoutes = new RegExp(`^\\/(${curatedOrDynamicRoutePrefixes.join('|')})\\/`);

  /* @TODO TECH DEBT: change topic and section fronts to use
  *  curatedOrDynamicRouteHandler() like we did for author pages
  */
  // If it's a curated/dynamic route (see curatedOrDynamicRoutePrefixes) apply curated/dynamic page logic.
  if (curatedOrDynamicRoutes.test(req.path)) {
    // Define param extraction logic.
    dynamicParamExtractor = new RegExp(`^\\/(?:${curatedOrDynamicRoutePrefixes.join('|')})\\/([^/]+)\\/?`);

    /**
     * We need logic to handle different routing between dynamic route pages and curated,
     * since both share the same slug prefixes.
     */
    promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`)
      .then(pageKey => {
        // Curated page found. Serve content collection.
        // Extract param keyword and set it to correct params key appropriately.
        if (routeParamKey === 'author') {
          params[routeParamKey] = req.path.match(dynamicParamExtractor)[1];
        }
        return db.get(`${pageKey}@published`);
      })
      .catch(error => {
        // If error was a "not found" error, then fallback to serving dynamic route page.
        const notFoundErrorPrefix = 'Key not found in database';

        if (error.message.substring(0, notFoundErrorPrefix.length) === notFoundErrorPrefix) {
          // Extract correct param and set it to params appropriately.
          params[`dynamic${_.capitalize(routeParamKey)}`] = req.path.match(dynamicParamExtractor)[1];
          return db.get(`${req.hostname}/_pages/${routePrefix}@published`);
        } else {
          throw error;
        }
      });
  } else {
    const route = routes.find(r => r.testPath(req));

    route.getParams(req, params);
    promise = route.getPageData(req);
  }

  // Compose and respond
  promise
    .then(data => {
      // Set locals
      fakeLocals(req, res, params);
      return composer.composePage(data, res.locals);
    })
    .then(composed => res.json(composed))
    .catch(err => {
      log('error', '404', { stack: err.stack });
      res
        .status(404)
        .json({ status: 404, msg: err.message });
    });
}

module.exports = middleware;
