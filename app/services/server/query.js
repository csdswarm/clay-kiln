'use strict';

const _every = require('lodash/every'),
  amphoraSearch = require('amphora-search'),
  bluebird = require('bluebird'),
  log = require('../universal/log').setup({ file: __filename }),
  indexWithPrefix = amphoraSearch.indexWithPrefix,
  universalQuery = require('../universal/query'),
  utils = require('../universal/utils'),
  { removeFirstLine, urlToElasticSearch } = utils;

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
 * Query Elastic and clean up raw result object to only display array
 *   of results.
 *
 * @param  {Object} query
 * @param  {Object} locals
 * @param  {SearchOpts} opts - see universal/query.js for the SearchOpts type
 * @return {Promise}
 * @example searchByQuery({"index":"local_published-content","type":"_doc",
    "body":{"query":{"bool":{"filter":{"term":{"canonicalUrl":""}}}}}})
 */
function searchByQuery(query, locals, opts = {}) {
  return universalQuery.searchByQuery(query, locals, opts, searchByQueryWithRawResult);
}

/**
 * Query Elastic client for results. If locals is passed then its loadedIds
 *   property will be updated.
 *
 * @param  {Object} query
 * @param  {Object} locals
 * @param  {SearchOpts} opts - see universal/query.js for the SearchOpts type
 * @return {Object}
 */
async function searchByQueryWithRawResult(query, locals, opts = {}) {
  if (!opts.hasOwnProperty('shouldDedupeContent')) {
    // we don't want the initial line with 'Error' because that's misleading
    const stack = removeFirstLine(new Error().stack);

    log(
      'warn',
      "opts.shouldDedupeContent wasn't passed to searchByQueryWithRawResult."
      + '\n  This should be passed in order to keep the code explicit because'
      + "\n  there's no good way to tell whether content should be deduped"
      + '\n  Right now it will default to true if locals is truthy and passes'
      + '\n  Object.isExtensible (locals is not extensible during the model ->'
      + '\n  save hook).  This should set it to false on server bootstrap and'
      + '\n  model save hooks.'
      + `\n${stack}`
    );

    opts.shouldDedupeContent = !!locals
      && Object.isExtensible(locals);
  }

  // we check for locals here because on amphora bootstrap locals doesn't exist.
  //   And when locals doesn't exist there's no reason to dedupe.
  const shouldDedupe = locals && opts.shouldDedupeContent,
    loadedIds = shouldDedupe
      ? locals.loadedIds.filter(id => id)
      : [];

  getSearchInstance();

  if (!module.exports.searchInstance) {
    return bluebird.reject(new Error('Search not instantiated.'));
  }

  loadedIds.forEach(_id => universalQuery.addMustNot(query, { match: { _id } }));

  let results = [];

  try {
    results = await module.exports.searchInstance.search(query);
  } catch (err) {
    log('info', 'this query resulted in an error\n' + JSON.stringify(query, null, 2));
    throw err;
  }

  log('trace', `got ${results.hits.hits.length} results`);
  log('debug', JSON.stringify(results));

  if (shouldDedupe) {
    const hits = results.hits.hits,
      allHitsHaveIds = _every(hits, aHit => aHit._id),
      resultIds = hits.map(aHit => aHit._id);

    if (hits.length && allHitsHaveIds) {
      locals.loadedIds = locals.loadedIds.concat(resultIds);
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
  log('error', `Error querying Elastic for component ${ref}`, e);
}

module.exports = newQueryWithPrefix;

Object.assign(module.exports, universalQuery, {
  executeMultipleSearchRequests,
  getCount,
  logCatch,
  newQueryWithCount,
  onePublishedArticleByUrl,
  searchByQuery,
  searchByQueryWithRawResult,
  searchInstance: null,
  updateByQuery
});
