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

  if (req.method !== 'GET' || !req.headers['x-amphora-page-json']) {
    return next();
  }

  // If it's a topic route att in the params and compose the page
  if (req.path.indexOf('/topic/') === 0) {

    /**
     * We need logic to handle different routing between dynamic topic pages and curated,
     * since both share the same slug prefix "/topic/".
     */
    promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`)
      .then(topicPageKey => {
        // Curated topic page found. Serve content collection.
        params.tag = req.path.match(/topic\/([^/]+)\/?/)[1];
        return db.get(`${topicPageKey}@published`);
      })
      .catch(error => {
        // If error was a "not found" error, then fallback to serving dynamic topic page.
        const notFoundErrorPrefix = 'Key not found in database';

        if (error.message.substring(0, notFoundErrorPrefix.length) === notFoundErrorPrefix) {
          params.dynamicTag = req.path.match(/topic\/([^/]+)\/?/)[1];
          return db.get(`${req.hostname}/_pages/topic@published`);
        } else {
          throw error;
        }

      });

  } else if (req.path.indexOf('/syndicated-authors/') === 0) {
    params.dynamicAuthor = req.path.match(/syndicated-authors\/(.+)\/?/)[1];
    promise = db.get(`${req.hostname}/_pages/author@published`);
  } else {
    _.each(process.env.SECTION_FRONTS.split(','), sectionFront => {
      if (req.path.indexOf(`/${sectionFront}/`) === 0) {
        let regExp = new RegExp(sectionFront + '\/(.+)\/?');
        params.dynamicTag = req.path.match(regExp)[1];
        promise = db.get(`${req.hostname}/_pages/topic@published`);
      }
    });
    if (!promise) {
      // Otherwise resolve the uri and page instance
      promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`).then(data => db.get(`${data}@published`));
    }
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
