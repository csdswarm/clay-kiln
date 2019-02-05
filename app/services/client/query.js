'use strict';

const universalQuery = require('../universal/query'),
  universalRest = require('../universal/rest'),
  utils = require('../universal/utils'),
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
    SITE_ENDPOINT = `//${locals.site.host}${locals.site.port !== 80 ? `:${locals.site.port}` : ''}${locals.site.path}/_search`;
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
 * @return {Promise}
 * @example searchByQuery({"index":"published-content","type":"_doc",
    "body":{"query":{"bool":{"filter":{"term":{"canonicalUrl":""}}}}}})
 */
function searchByQuery(query) {
  return searchByQueryWithRawResult(query)
    .then(universalQuery.formatSearchResult)
    .catch(e => {
      throw new Error(e);
    });

}

/**
 * Query Elastic using the _search endpoint
 * @param  {Object} query
 * @return {Object}
 */
function searchByQueryWithRawResult(query) {
  log('trace', 'performing elastic search', { query: query });

  return module.exports.post(SITE_ENDPOINT, query, true).then(function (results) {
    log('trace', `got ${results.hits.hits.length} results`, { results: results});
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
  SITE_ENDPOINT = `http://${locals.site.host}:${locals.site.port}${locals.site.path}/_update`;

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
    log('trace', `got ${results.hits.hits.length} results`, { results: results});
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
  const query = newQueryWithCount('published-content', null, locals);

  universalQuery.addFilter(query, {term: {canonicalUrl: utils.urlToCanonicalUrl(url)}});
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
module.exports.newQueryWithCount = newQueryWithCount;
module.exports.searchByQuery = searchByQuery;
module.exports.searchByQueryWithRawResult = searchByQueryWithRawResult;
module.exports.getCount = getCount;
module.exports.executeMultipleSearchRequests = executeMultipleSearchRequests;
module.exports.updateByQuery = updateByQuery;
module.exports.onePublishedArticleByUrl = onePublishedArticleByUrl;
module.exports.logCatch = logCatch;

module.exports.addAggregation = universalQuery.addAggregation;
module.exports.addShould = universalQuery.addShould;
module.exports.addFilter = universalQuery.addFilter;
module.exports.addMust = universalQuery.addMust;
module.exports.addMustNot = universalQuery.addMustNot;
module.exports.addMinimumShould = universalQuery.addMinimumShould;
module.exports.addSort = universalQuery.addSort;
module.exports.addSize = universalQuery.addSize;
module.exports.onlyWithTheseFields = universalQuery.onlyWithTheseFields;
module.exports.onlyWithinThisSite = universalQuery.onlyWithinThisSite;
module.exports.withinThisSiteAndCrossposts = universalQuery.withinThisSiteAndCrossposts;
module.exports.formatAggregationResults = universalQuery.formatAggregationResults;
module.exports.formatSearchResult = universalQuery.formatSearchResult;
module.exports.moreLikeThis = universalQuery.moreLikeThis;

// For testing
module.exports.post = universalRest.post;
