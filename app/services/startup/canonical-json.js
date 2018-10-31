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
function fakeLocals(req, res) {
  _.each(sites.sites(), site => {
    res.locals.url = db.uriToUrl(req.hostname + req.originalUrl, site.protocol, site.port);
    res.locals.site = site;
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
  if (req.method !== 'GET' || !req.headers['x-amphora-page-json']) {
    return next();
  }

  fakeLocals(req, res)

  const prefix = `${req.hostname}/_uris/`,
    pageReference = `${prefix}${buffer.encode(req.hostname + req.baseUrl + req.path)}`

  db.getUri(pageReference)
    .then(db.get)
    .then(data => composer.composePage(data, res.locals))
    .then(composed => res.json(composed)); // Express doesn't like `.then(res.json)`
}

module.exports = middleware;
