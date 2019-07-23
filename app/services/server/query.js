'use strict';

const _every = require('lodash/every'),
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  _isEmpty = require('lodash/isEmpty'),
  amphoraSearch = require('amphora-search'),
  bluebird = require('bluebird'),
  log = require('../universal/log').setup({ file: __filename }),
  indexWithPrefix = amphoraSearch.indexWithPrefix,
  universalQuery = require('../universal/query'),
  utils = require('../universal/utils'),
  loadedIdsService = require('./loaded-ids');

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
 * Query Elastic and clean up raw result object to only display array of
 *   results.  If locals is passed then its loadedIds property will be updated.
 *
 * @param  {Object} query
 * @param  {Object} [locals]
 * @return {Promise}
 * @example searchByQuery({"index":"local_published-content","type":"_doc",
    "body":{"query":{"bool":{"filter":{"term":{"canonicalUrl":""}}}}}})
 */
function searchByQuery(query, locals) {
  return searchByQueryWithRawResult(query, locals)
    .then(universalQuery.formatSearchResult)
    .then(universalQuery.formatProtocol)
    .catch(e => {
      throw new Error(e);
    });
}

/**
 * Adds all the _id's from the query results to locals.loadedIds
 *
 * Note: this method should only be called if locals was passed
 *
 * @param {object} results
 * @param {object} locals
 */
async function appendLoadedIdsToLocalsAndRedis(results, locals) {
  const hits = results.hits.hits,
    allHitsHaveIds = _every(hits, h => h._id),
    resultIds = results.hits.hits.map(h => h._id);

  if (_isEmpty(hits) || !allHitsHaveIds) {
    return;
  }

  locals.loadedIds = locals.loadedIds.concat(resultIds);
  await loadedIdsService.appendLoadedIds(locals.rdcSessionID, resultIds);
}

/**
 * Note: This method mutates query.  Also it should only ever be called when
 *   there exists loadedIds.
 *
 * @param {object} query
 * @param {string[]} loadedIds
 */
function addMustNotGetLoadedIds(query, loadedIds) {
  const bool = _get(query, 'body.query.bool', {}),
    // I couldn't find a good elasticsearch way to query "must not match any of
    //   these values".
    matchAnyLoadedIds = loadedIds.map(_id => ({ match: { _id } }));

  _set(query, 'body.query.bool', bool);

  // needs to be declared after body.query.bool is set
  // eslint-disable-next-line one-var
  const mustNot = _get(bool, 'must_not', []);

  if (!Array.isArray(mustNot)) {
    // must_not must be an object then and turned into an array
    mustNot = [bool.must_not];
  }

  bool.must_not = mustNot.concat(matchAnyLoadedIds);
}

/**
 * Query Elastic client for results. If locals is passed then its loadedIds
 *   property will be updated.
 *
 * @param  {Object} query
 * @param  {Object} [locals]
 * @return {Object}
 */
async function searchByQueryWithRawResult(query, locals) {
  const localsWasPassed = !!locals,
    loadedIds = localsWasPassed
      ? await loadedIdsService.lazilyGetLoadedIdsFromLocals(locals)
      : [],
    hasLoadedIds = !_isEmpty(loadedIds);

  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Search not instantiated.');
  }

  if (hasLoadedIds) {
    addMustNotGetLoadedIds(query, loadedIds);
  }

  return module.exports.searchInstance.search(query)
    .then(async (results) => {
      log('trace', `got ${results.hits.hits.length} results`);
      log('debug', JSON.stringify(results));

      if (localsWasPassed) {
        await appendLoadedIdsToLocalsAndRedis(results, locals);
      }

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
module.exports.addSource = universalQuery.addSource;
module.exports.onlyWithTheseFields = universalQuery.onlyWithTheseFields;
module.exports.onlyWithinThisSite = universalQuery.onlyWithinThisSite;
module.exports.withinThisSiteAndCrossposts = universalQuery.withinThisSiteAndCrossposts;
module.exports.formatAggregationResults = universalQuery.formatAggregationResults;
module.exports.formatSearchResult = universalQuery.formatSearchResult;
module.exports.moreLikeThis = universalQuery.moreLikeThis;
module.exports.moreLikeThis = universalQuery.moreLikeThis;
module.exports.newNestedQuery = universalQuery.newNestedQuery;
