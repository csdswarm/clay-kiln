'use strict';

const universalQuery = require('../universal/query'),
  universalRest = require('../universal/rest'),
  utils = require('../universal/utils'),
  { urlToElasticSearch } = utils,
  log = require('../universal/log').setup({ file: __filename, context: 'client' });

var SITE_ENDPOINT;

/**
 * Start a new query with the specified index
 * and types for the query
 * Gets _search endpoint based on site currently on
 *
 * @param  {String} index
 * @param {Object} locals
 * @return {Object}
 * @example newQueryWithLocals('published-content', locals)
 */
function newQueryWithLocals(index, locals) {
  if (locals) {
    SITE_ENDPOINT = `//${locals.site.host}${locals.site.path}/_search`;
  }
  return universalQuery(index);
}

/**
 * Start a new query with the specified index
 * and types for the query with a size property
 *
 * If no count is given, size defaults to 10 as per
 * Elastic's default settings
 * @param  {String} index
 * @param  {number} count
 * @param  {Object} locals
 * @return {Object}
 */
function newQueryWithCount(index, count, locals) {
  const query = newQueryWithLocals(index, locals);

  return universalQuery.addSize(query, count);
}

/**
 * Query Elastic and clean up raw result object
 * to only display array of results
 * @param  {Object} query
 * @param  {Object} locals
 * @param  {SearchOpts} [opts] - see universal/query.js for the SearchOpts type
 * @return {Promise}
 * @example searchByQuery({"index":"published-content","type":"_doc",
    "body":{"query":{"bool":{"filter":{"term":{"canonicalUrl":""}}}}}})
 */
function searchByQuery(query, locals, opts = {}) {
  return universalQuery.searchByQuery(query, locals, opts, searchByQueryWithRawResult);
}

/**
 * Query Elastic using the _search endpoint
 * @param  {Object} query
 * @return {Object}
 */
function searchByQueryWithRawResult(query) {
  log('trace', 'performing elastic search', { query });

  return module.exports.post(SITE_ENDPOINT, query, true).then(function (results) {
    log('trace', `got ${results.hits.hits.length} results`, { results });
    return results;
  });
}

/**
 * Update Elastic document through `_update` endpoint
 * @param  {Object} query
 * @param  {Object} locals
 * @return {Promise}
 */
function updateByQuery(query, locals) {
  SITE_ENDPOINT = `http://${locals.site.host}${locals.site.path}/_update`;

  return module.exports.post(SITE_ENDPOINT, query, true)
    .then(function (results) {
      log('info', 'updated elastic document');
      return results;
    });
}

/**
 * Get number of results found
 * @param  {Object} query
 * @return {number}
 */
function getCount(query) {
  log('trace', 'getting count', { query: query });

  return module.exports.post(SITE_ENDPOINT, query, true)
    .then(function (result) {
      return result.hits.total;
    })
    .catch(function (err) {
      log('warn', 'error retrieving count', { error: err });
      return 0;
    });
}

/**
 * @param {object} query
 * @returns {object}
 */
function executeMultipleSearchRequests(query) {
  log('trace', 'performing elastic search', { query: query });

  return module.exports.post(SITE_ENDPOINT, query, true).then(function (results) {
    log('trace', `got ${results.hits.hits.length} results`, { results: results });
    return results;
  });
}

/**
 * construct query to get published article instance from url
 * @param {string} url
 * @param {Array} fields you want returned
 * @param {Object} locals
 * @returns {Promise}
 */
function onePublishedArticleByUrl(url, fields, locals) {
  const query = newQueryWithCount('published-content', null, locals),
    canonicalUrl = utils.urlToCanonicalUrl(
      urlToElasticSearch(url)
    );

  universalQuery.addFilter(query, {
    term: { canonicalUrl }
  });
  if (fields) {
    universalQuery.onlyWithTheseFields(query, fields);
  }

  return query;
}

/**
 * Log error to console when a query fails
 * @param  {Error} e
 * @param  {String} ref
 */
function logCatch(e, ref) {
  log('error', `Error querying Elastic for component ${ref}`);
}

module.exports = newQueryWithLocals;
module.exports.executeMultipleSearchRequests = executeMultipleSearchRequests;
module.exports.getCount = getCount;
module.exports.logCatch = logCatch;
module.exports.newQueryWithCount = newQueryWithCount;
module.exports.onePublishedArticleByUrl = onePublishedArticleByUrl;
module.exports.searchByQuery = searchByQuery;
module.exports.searchByQueryWithRawResult = searchByQueryWithRawResult;
module.exports.updateByQuery = updateByQuery;

module.exports.addAggregation = universalQuery.addAggregation;
module.exports.addFilter = universalQuery.addFilter;
module.exports.addMinimumShould = universalQuery.addMinimumShould;
module.exports.addMust = universalQuery.addMust;
module.exports.addMustNot = universalQuery.addMustNot;
module.exports.addSearch = universalQuery.addSearch;
module.exports.addShould = universalQuery.addShould;
module.exports.addSize = universalQuery.addSize;
module.exports.addSort = universalQuery.addSort;
module.exports.formatAggregationResults = universalQuery.formatAggregationResults;
module.exports.getFormatSearchResult = universalQuery.getFormatSearchResult;
module.exports.matchIgnoreCase = universalQuery.matchIgnoreCase;
module.exports.matchSimple = universalQuery.matchSimple;
module.exports.moreLikeThis = universalQuery.moreLikeThis;
module.exports.newNestedQuery = universalQuery.newNestedQuery;
module.exports.onlyWithTheseFields = universalQuery.onlyWithTheseFields;
module.exports.onlyWithinThisSite = universalQuery.onlyWithinThisSite;
module.exports.terms = universalQuery.terms;
module.exports.withinThisSiteAndCrossposts = universalQuery.withinThisSiteAndCrossposts;

// For testing
module.exports.post = universalRest.post;
