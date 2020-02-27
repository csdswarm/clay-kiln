'use strict';
const
  _filter = require('lodash/filter'),
  _get = require('lodash/get'),
  _identity = require('lodash/identity'),
  _isArray = require('lodash/isArray'),
  _isEmpty = require('lodash/isEmpty'),
  _isNull = require('lodash/isNull'),
  _isObject = require('lodash/isObject'),
  _isString = require('lodash/isString'),
  _isUndefined = require('lodash/isUndefined'),
  _parse = require('url-parse'),
  publishedVersionSuffix = '@published',
  kilnUrlParam = '&currentUrl=';



/**
 * returns a list of keys in the object that have a truthy value
 * @param {object} obj
 * @returns {string[]}
 */
function boolKeys(obj) {
  return Object.keys(obj || {}).filter(key => obj[key]);
}

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
 * Replace https with http and removes query string
 *
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(url) {
  return url.split('?')[0].replace('https://', 'http://');
}

/**
 * generate a uri from a url
 * @param  {string} url
 * @return {string}
 */
function urlToUri(url) {
  const parsed = _parse(url);

  return `${parsed.hostname}${parsed.pathname}`;
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

/**
 * Trims, lowercases, replaces spaces with dashes and urlencodes the string
 * @param {string} text
 * @returns {string}
 */
function textToEncodedSlug(text) {
  return encodeURIComponent(
    text
      .toLowerCase()
      .trim()
      .replace(/ /g, '-')
  );
}

function debugLog(...args) {
  if (process.env.NODE_ENV === 'local') {
    console.log(...args); // eslint-disable-line no-console
  }
}

/**
 * prepends left to right
 *
 * meant to be used in a mapper function e.g.
 *
 * ```
 * const namespace = 'msn-feed:',
 *   msnRedisKeys = ['last-modified', 'urls-last-queried']
 *     .map(prepend(namespace))
 *
 * console.log(msnRedisKeys)
 * // outputs
 * // [ 'msn-feed:last-modified', 'msn-feed:urls-last-queried' ]
 * ```
 *
 * @param {string} left
 * @returns {function}
 */
function prepend(left) {
  return right => left + right;
}

/**
 * return yes/no dependent on val truthiness
 *
 * @param  {*}  val
 * @returns {String}
 */
function yesNo(val) {
  if (val) {
    return 'Yes';
  } else {
    return 'No';
  }
}

/**
 * removes the first line in a string
 *
 * @param {string} str
 * @returns {string}
 */
function removeFirstLine(str) {
  if (typeof str !== 'string') {
    throw new Error(
      'you must provide a string'
      + '\n  typeof str: ' + typeof str
    );
  }

  return str.split('\n').slice(1).join('\n');
}

/**
 * returns the domain of the hostname
 *
 * @param {string} hostname
 * @returns {string}
 */
function getDomainFromHostname(hostname) {
  return hostname.split('.').reverse().slice(0, 2).reverse().join('.');
}

/**
 * can be used to get all _ref objects within an object.
 * Copied from amphora.references and modified for unity environment.
 * Why? Because amphora cannot be used in client or universal scripts without throwing errors.
 * @param {object} obj
 * @param {Function|string} [filter=_identity]  Optional filter
 * @returns {array}
 */
function listDeepObjects(obj, filter) {
  let cursor, items,
    list = [],
    queue = [obj];

  while (queue.length) {
    cursor = queue.pop();
    items = _filter(cursor, _isObject);
    list = list.concat(_filter(items, filter || _identity));
    queue = queue.concat(items);
  }

  return list;
}

/**
 * Url queries to elastic search need to be `http` since that is
 * how it is indexed as.
 * @param {string} url
 * @returns {string}
 */
function urlToElasticSearch(url) {
  return url.replace('https', 'http');
}

module.exports = {
  boolKeys,
  cleanUrl,
  debugLog,
  ensurePublishedVersion,
  formatStart,
  getDomainFromHostname,
  getSiteBaseUrl,
  has,
  isFieldEmpty,
  isInstance,
  isPublishedVersion,
  isUrl,
  listDeepObjects,
  prepend,
  removeFirstLine,
  replaceVersion,
  textToEncodedSlug,
  toTitleCase,
  uriToUrl,
  urlToCanonicalUrl,
  urlToElasticSearch,
  urlToUri,
  yesNo
};
