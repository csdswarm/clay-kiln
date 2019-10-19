'use strict';
const _isArray = require('lodash/isArray'),
  _isObject = require('lodash/isObject'),
  _isEmpty = require('lodash/isEmpty'),
  _isString = require('lodash/isString'),
  _isNull = require('lodash/isNull'),
  _isUndefined = require('lodash/isUndefined'),
  _get = require('lodash/get'),
  _parse = require('url-parse'),
  publishedVersionSuffix = '@published',
  kilnUrlParam = '&currentUrl=';

/**
 * determine if a field is empty
 * @param  {*}  val
 * @return {Boolean}
 */
function isFieldEmpty(val) {
  if (_isArray(val) || _isObject(val)) {
    return _isEmpty(val);
  } else if (_isString(val)) {
    return val.length === 0; // emptystring is empty
  } else if (_isNull(val) || _isUndefined(val)) {
    return true; // null and undefined are empty
  } else {
    // numbers, booleans, etc are never empty
    return false;
  }
}

/**
 * convenience function to determine if a field exists and has a value
 * @param  {*}  val
 * @return {Boolean}
 */
function has(val) {
  return !isFieldEmpty(val);
}

/**
 * determine if a string is a url
 * @param  {string}  str
 * @return {Boolean}
 */
function isUrl(str) {
  return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(str);
}

/**
 * replace version in uri
 * e.g. when fetching @published data, or previous component data
 * @param  {string} uri
 * @param  {string} [version] defaults to latest
 * @return {string}
 */
function replaceVersion(uri, version) {
  if (!_isString(uri)) {
    throw new TypeError('Uri must be a string, not ' + typeof uri);
  }

  if (version) {
    uri = uri.split('@')[0] + '@' + version;
  } else {
    // no version is still a kind of version
    uri = uri.split('@')[0];
  }

  return uri;
}

/**
 * generate a url from a uri (and some site data)
 * @param  {string} uri
 * @param  {object} locals
 * @return {string}
 */
function uriToUrl(uri, locals) {
  const protocol = _get(locals, 'site.protocol') || 'http',
    parsed = _parse(`${protocol}://${uri}`);

  return parsed.href;
}

/**
 * Remove extension from route / path.
 *
 * Note: copied from amphora@v7.3.2 lib/responses.js
 *   Ideally we'd use the uri provided by amphora but our currentStation module
 *   depends on this and its middleware occurrs before amphora.
 *
 * @param {string} path
 * @returns {string}
 */
function removeExtension(path) {
  let leadingDot, endSlash = path.lastIndexOf('/');

  if (endSlash > -1) {
    leadingDot = path.indexOf('.', endSlash);
  } else {
    leadingDot = path.indexOf('.');
  }

  if (leadingDot > -1) {
    path = path.substr(0, leadingDot);
  }
  return path;
}

/**
 * generate a uri from a url
 * @param  {string} url
 * @return {string}
 */
function urlToUri(url) {
  const parsed = _parse(url);

  return `${parsed.hostname}${removeExtension(parsed.pathname)}`;
}

/**
 * Make sure start is defined and within a justifiable range
 *
 * @param {int} n
 * @returns {int}
 */
function formatStart(n) {
  var min = 0,
    max = 100000000;

  if (typeof n === 'undefined' || Number.isNaN(n) || n < min || n > max) {
    return 0;
  } else {
    return n;
  }
}

/**
 * Make the start of every word capitalized
 *
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  return str && str.replace(/\w[^\s\-]*/g, l => l.charAt(0).toUpperCase() + l.substr(1));
}

/*
 *
 * @param {object} locals
 * @param {string} [locals.site.protocol]
 * @param {string} locals.site.host
 * @param {string} [locals.site.path]
 * @returns {string} e.g. `http://nymag.com/scienceofus` or `http://localhost.dev.nymag.biz:3001/scienceofus`
 */
function getSiteBaseUrl(locals) {
  const site = locals.site || {},
    protocol = site.protocol || 'http',
    host = site.host,
    path = site.path || '';

  return `${protocol}://${host}${path}`;
}

/**
 *
 * @param {string} uri
 * @returns {boolean}
 */
function isPublishedVersion(uri) {
  return uri.indexOf(publishedVersionSuffix) === uri.length - 10;
}

/**
 * takes a uri and always returns the published version of that uri
 * @param {string} uri
 * @returns {string}
 */
function ensurePublishedVersion(uri) {
  return isPublishedVersion(uri) ? uri : uri.split('@')[0] + publishedVersionSuffix;
}

/**
 * checks if uri is an instance of a component
 * @param {string} uri
 * @returns {boolean}
 */
function isInstance(uri) {
  return uri.indexOf('/instances/') > -1;
}

/**
 * kiln sometimes stores the url in a query param
 * @param {string} url
 * @returns {string}
 */
function kilnUrlToPageUrl(url) {
  return url.indexOf(kilnUrlParam) > -1 ? decodeURIComponent(url.split(kilnUrlParam).pop()) : url;
}

/**
 * removes query params and hashes
 * e.g. `http://canonicalurl?utm-source=facebook#heading` becomes `http://canonicalurl`
 * @param {string} url
 * @returns {string}
 */
function urlToCanonicalUrl(url) {
  return kilnUrlToPageUrl(url).split('?')[0].split('#')[0];
}

function debugLog(...args) {
  if (process.env.NODE_ENV === 'local') {
    console.log(...args); // eslint-disable-line no-console
  }
}

function ensureStartsWith(prefix, str) {
  return str.startsWith(prefix)
    ? str
    : prefix + str;
}

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function getFullOriginalUrl(req) {
  return process.env.CLAY_SITE_PROTOCOL + '://' + req.get('host') + req.originalUrl;
}

module.exports = {
  isFieldEmpty,
  has,
  replaceVersion,
  isUrl,
  uriToUrl,
  urlToUri,
  formatStart,
  toTitleCase,
  getSiteBaseUrl,
  isPublishedVersion,
  ensurePublishedVersion,
  isInstance,
  urlToCanonicalUrl,
  debugLog,
  ensureStartsWith,
  prettyJSON,
  getFullOriginalUrl
};
