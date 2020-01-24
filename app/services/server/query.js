'use strict';

const amphoraSearch = require('amphora-search'),
  bluebird = require('bluebird'),
  log = require('../universal/log').setup({ file: __filename }),
  indexWithPrefix = amphoraSearch.indexWithPrefix,
  universalQuery = require('../universal/query'),
  utils = require('../universal/utils'),
  { urlToElasticSearch } = utils;

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
 * @param  {Object} [locals]
 * @param  {Object} [query]
 * @return {Object}
 * @example newQueryWithPrefix('published-content')
 */
function newQueryWithPrefix(index, locals, query) {
  const uniQuery = universalQuery(index, query);

  uniQuery.index = prependPrefix(index);
  return uniQuery;
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
    .then(universalQuery.formatProtocol)
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

  return module.exports.searchInstance.update({ index: prependPrefix(index), id, body, refresh })
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
  const query = newQueryWithCount('published-content'),
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

module.exports = newQueryWithPrefix;

Object.assign(module.exports, universalQuery, {
  searchInstance: null,
  newQueryWithCount,
  searchByQuery,
  searchByQueryWithRawResult,
  getCount,
  executeMultipleSearchRequests,
  updateByQuery,
  onePublishedArticleByUrl,
  logCatch
});
