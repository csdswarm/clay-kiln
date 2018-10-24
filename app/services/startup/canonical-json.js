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
 */
function middleware(req, res, next) {
  var promise, params = {};

  if (req.method !== 'GET' || !req.headers['x-amphora-page-json']) {
    return next();
  }

  // If it's a tag route att in the params and compose the page
  if (req.path.indexOf('/tags/') === 0) {
    params.tag = req.path.match(/tags\/(.+)\.html/)[1];
    promise = db.get(`${req.hostname}/_pages/tag@published`);
  } else {
    // Otherwise resolve the uri and page instance
    promise = db.getUri(`${req.hostname}/_uris/${buffer.encode(`${req.hostname}${req.baseUrl}${req.path}`)}`).then(db.get);
  }
  // Set locals
  fakeLocals(req, res, params)
  // Compose and respond
  promise.then(data => composer.composePage(data, res.locals))
    .then(composed => res.json(composed));
}

module.exports = middleware;
