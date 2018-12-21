'use strict';

const _ = require('lodash'),
  db = require('../server/db'),
  buffer = require('../server/buffer'),
  { sites, composer } = require('amphora');

/**
 * Pulled from inside Amphora to fake locals
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params
 */
function fakeLocals(req, res, params) {
  _.each(sites.sites(), site => {
    res.locals.url = db.uriToUrl(req.hostname + req.originalUrl, site.protocol, site.port);
    res.locals.site = site;
    res.locals.params = params;
  });
}

/**
 * If you add the `X-Amphora-Page-JSON` header to a request
 * to a canonical url you can grab the page's JSON.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Function}
 */
function middleware(req, res, next) {
  var promise, params = {};
  let curatedOrDynamicRoutePrefixes, curatedOrDynamicRoutes, tagKeywordExtractor;

  if (req.method !== 'GET' || !req.headers['x-amphora-page-json']) {
    return next();
  }

  // Define Curated/Dynamic "tag" routes.
  // Match against section-front and "topic" slug prefixes
  curatedOrDynamicRoutePrefixes = process.env.SECTION_FRONTS ? process.env.SECTION_FRONTS.split(',') : [];
  curatedOrDynamicRoutePrefixes.push('topic');

  // Define curated/dynamic routing logic
  curatedOrDynamicRoutes = new RegExp(`^\\/(${curatedOrDynamicRoutePrefixes.join('|')})\\/`);

  // If it's a topic or section-front route (see curatedOrDynamicRoutePrefixes) apply curated/dynamic tag page logic.
  if (curatedOrDynamicRoutes.test(req.path)) {

    // Define keyword extraction logic.
    tagKeywordExtractor = new RegExp(`^\\/(?:${curatedOrDynamicRoutePrefixes.join('|')})\\/([^/]+)\\/?`);

    /**
     * We need logic to handle different routing between dynamic topic/section-front pages and curated,
     * since both share the same slug prefixes.
     */
    promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`)
      .then(pageKey => {
        // Curated topic/section-front page found. Serve content collection.
        // Extract tag keyword and set it to params appropriately.
        params.tag = req.path.match(tagKeywordExtractor)[1];
        return db.get(`${pageKey}@published`);
      })
      .catch(error => {
        // If error was a "not found" error, then fallback to serving dynamic topic/section-front page.
        const notFoundErrorPrefix = 'Key not found in database';

        if (error.message.substring(0, notFoundErrorPrefix.length) === notFoundErrorPrefix) {
          // Extract tag keyword and set it to params appropriately.
          params.dynamicTag = req.path.match(tagKeywordExtractor)[1];
          return db.get(`${req.hostname}/_pages/topic@published`);
        } else {
          throw error;
        }

      });

  } else if (req.path.indexOf('/authors/') === 0) {
    params.dynamicAuthor = req.path.match(/authors\/(.+)\/?/)[1];
    promise = db.get(`${req.hostname}/_pages/author@published`);
  } else {
    // Otherwise resolve the uri and page instance
    promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`).then(data => db.get(`${data}@published`));
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
      res
        .status(404)
        .json({ status: 404, msg: err.message });
    });
}

module.exports = middleware;
