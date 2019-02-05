'use strict';

const amphoraSearch = require('amphora-search'),
  bluebird = require('bluebird'),
  log = require('../universal/log').setup({ file: __filename }),
  indexWithPrefix = amphoraSearch.indexWithPrefix,
  universalQuery = require('../universal/query'),
  utils = require('../universal/utils');

/**
 * Get ElasticSearch client reference
 */
function getSearchInstance() {
  if (!module.exports.searchInstance) {
    module.exports.searchInstance = amphoraSearch.getInstance();
  }
}

/**
 * Prepend local prefix to index
 * @param  {String} indexString
 * @return {String}
 */
function prependPrefix(indexString) {
  return indexString.split(',').map(function (index) {
    return indexWithPrefix(index, process.env.ELASTIC_PREFIX);
  }).join(',');
}

/**
 * Start a new query with the specified index
 * and types for the query
 * Prepends local prefix for Elastic Search client
 *
 * @param  {String} index
 * @param  {object} [locals] note: the client/query.js version requires `locals`, but this version does not
 * @return {Object}
 * @example newQueryWithPrefix('published-content')
 */
function newQueryWithPrefix(index) {
  var query = universalQuery(index);

  query.index = prependPrefix(index);
  return query;
}

/**
 * Start a new query with the specified index
 * and types for the query with a size property
 *
 * If no count is given, size defaults to 10 as per
 * Elastic's default settings
 * @param  {String} index
 * @param  {number} count
 * @return {Object}
 */
function newQueryWithCount(index, count) {
  const query = newQueryWithPrefix(index);

  return universalQuery.addSize(query, count);
}

/**
 * Query Elastic and clean up raw result object
 * to only display array of results
 * @param  {Object} query
 * @return {Promise}
 * @example searchByQuery({"index":"local_published-content","type":"_doc",
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
 * Query Elastic client for results
 * @param  {Object} query
 * @return {Object}
 */
function searchByQueryWithRawResult(query) {
  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Search not instantiated.');
  }

  return module.exports.searchInstance.search(query).then(function (results) {
    log('trace', `got ${results.hits.hits.length} results`);
    log('debug', JSON.stringify(results));
    return results;
  });
}
/**
 * Update Elastic document
 * @param  {Object} query
 * @return {Promise}
 */
function updateByQuery(query) {
  var { index, id, body, refresh } = query;

  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Update not instantiated.');
  }

  return module.exports.searchInstance.update({index: prependPrefix(index), id, body, refresh })
    .then(function (results) {
      log('trace', 'updated elastic document');
      return results;
    });
}

/**
 * Get number of results found
 * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference-2-4.html#api-count-2-4
 *
 * @param  {Object} query
 * @return {number}
 */
function getCount(query) {
  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Search not instantiated.');
  }

  return module.exports.searchInstance.count(query)
    .then(result => {
      return result.count;
    })
    .catch(function (err) {
      log('warn', 'error retrieving count', {
        error: err.message
      });
      return 0;
    });
}

/**
 * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference-2-4.html#api-msearch-2-4
 *
 * @param {object} query
 * @returns {object}
 * @example instance.msearch({index : 'original-videos-all'},
      {query : {filtered: {filter: {term: {title: 'dalia'}}}}}, {query : {filtered: {filter: {term: {title: 'nymag'  }}}}})
 */
function executeMultipleSearchRequests(query) {
  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Search not instantiated.');
  }

  return module.exports.searchInstance.msearch(query).then(function (results) {
    log('debug', JSON.stringify(results));
    return results;
  });
}

/**
 * construct query to get published article instance from url
 * @param {string} url
 * @param {Array} fields you want returned
 * @returns {Promise}
 */
function onePublishedArticleByUrl(url, fields) {
  const query = newQueryWithCount('published-content');

  universalQuery.addFilter(query, {
    term: {
      canonicalUrl: utils.urlToCanonicalUrl(url)
    }
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

module.exports = newQueryWithPrefix;
module.exports.searchInstance = null;
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
module.exports.addOffset = universalQuery.addOffset;
module.exports.onlyWithTheseFields = universalQuery.onlyWithTheseFields;
module.exports.onlyWithinThisSite = universalQuery.onlyWithinThisSite;
module.exports.withinThisSiteAndCrossposts = universalQuery.withinThisSiteAndCrossposts;
module.exports.formatAggregationResults = universalQuery.formatAggregationResults;
module.exports.formatSearchResult = universalQuery.formatSearchResult;
module.exports.moreLikeThis = universalQuery.moreLikeThis;
