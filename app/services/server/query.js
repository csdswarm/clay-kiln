'use strict';

const _every = require('lodash/every'),
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
 * @param  {Object} locals
 * @param  {Object} opts - various search options shared with
 *                         searchByQueryWithRawResult.  This method relies on
 *                           : 'includeIdInResult'
 *                           : 'transofrmResult'
 * @return {Promise}
 * @example searchByQuery({"index":"local_published-content","type":"_doc",
    "body":{"query":{"bool":{"filter":{"term":{"canonicalUrl":""}}}}}})
 */
function searchByQuery(query, locals, opts) {
  const formatSearchResult = universalQuery.getFormatSearchResult(opts);

  return searchByQueryWithRawResult(query, locals, opts)
    .then(async rawResult => {
      let formattedResult = await formatSearchResult(rawResult);

      formattedResult = await universalQuery.formatProtocol(formattedResult);

      if (!opts.transformResult) {
        return formattedResult;
      }

      return opts.transformResult(formattedResult, rawResult);
    })
    .catch(originalErr => {
      const err = originalErr instanceof Error
        ? originalErr
        : new Error(originalErr);

      return Promise.reject(err);
    });
}

/**
 * Query Elastic client for results. If locals is passed then its loadedIds
 *   property will be updated.
 *
 * @param  {Object} query
 * @param  {Object} locals
 * @param  {Object} opts - various search options shared with searchByQuery.
 *   This method uses 'shouldDedupeContent'.
 * @return {Object}
 */
async function searchByQueryWithRawResult(query, locals, opts = {}) {
  if (!opts.hasOwnProperty('shouldDedupeContent')) {
    log(
      'warn',
      "opts.shouldDedupeContent wasn't passed to searchByQueryWithRawResult."
      + '\n  This should be passed in order to keep the code explicit.'
      + '\n  Right now it will default to true if locals is truthy and passes'
      + '\n  Object.isExtensible (locals is not extensible during the model ->'
      + '\n  save hook).'
    );

    opts.shouldDedupeContent = !!locals
      && Object.isExtensible(locals);
  }

  const loadedIds = opts.shouldDedupeContent
    ? await loadedIdsService.lazilyGetFromLocals(locals)
    : [];

  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject('Search not instantiated.');
  }

  loadedIds.forEach(_id => universalQuery.addMustNot(query, { match: { _id } }));
  // we need the above logic to run before we can get the results
  // eslint-disable-next-line one-var
  const results = await module.exports.searchInstance.search(query);

  log('trace', `got ${results.hits.hits.length} results`);
  log('debug', JSON.stringify(results));

  if (opts.shouldDedupeContent) {
    const hits = results.hits.hits,
      allHitsHaveIds = _every(hits, h => h._id),
      resultIds = hits.map(h => h._id);

    if (hits.length && allHitsHaveIds) {
      await loadedIdsService.appendToLocalsAndRedis(resultIds, locals);
    }
  }

  return results;
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
  log('error', `Error querying Elastic for component ${ref}`, e);
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
