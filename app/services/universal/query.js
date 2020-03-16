'use strict';

const _ = require('lodash'),
  utils = require('../universal/utils'),
  protocol = process
    ? `${_.get(process, 'env.CLAY_SITE_PROTOCOL', 'https')}:`
    : window.location.protocol;

/**
 * SearchOpts - options which modify the behavior of elasticsearch
 *
 * shouldDedupeContent determines whether elasticsearch should use
 *   locals.loadedIds to filter out results.  A warning will be logged if this
 *   property is not passed.  The reason for this is there's no great way to
 *   determine whether content should be deduped without explicitly stating it.
 *
 * transformResult has the signature ({object} formattedResult, {object} rawResult) => {object} updatedFormattedResult
 *   its purpose is to transform the formatted result into something you need.
 *   I used it in more-content-feed/model.js to return whether more content existed.
 *
 * @typedef {object} SearchOpts
 * @property {boolean} includeIdInResult - includes '_id' in the formatted result
 * @property {boolean} shouldDedupeContent - see above for explanation
 * @property {function} transformResult - see above for the signature and explanation
 */

/**
 * Returns a function which formats the search results based off the search
 *   options.  Specifically if the option 'includeIdInResult' is truthy, then
 *   each hit's '_id' is assigned to its '_source' object.
 *
 * @param {SearchOpts} [searchOpts] - see typedef above
 * @returns {function}
 */
function getFormatSearchResult(searchOpts = {}) {
  return result => {
    if (!searchOpts.includeIdInResult) {
      return _.map(result.hits.hits, '_source');
    }

    return result.hits.hits.map(hit => {
      hit._source._id = hit._id;
      return hit._source;
    });
  };
}

/**
 * Returns result with any canonicalUrls having the proper protocol
 *
 * @param {object} result
 * @returns {Array}
 */
function formatProtocol(result) {
  return _.map(result, article => {
    const url = _.get(article, 'canonicalUrl');

    if (url) {
      return { ...article, canonicalUrl: url.replace(/^http:/, protocol) };
    }

    return article;
  });
}

/**
 * Returns the root key where additional properties should be added
 *
 * @param {Object} query
 * @return {string}
 */
function getRoot(query) {
  return query.nested ? 'nested' : 'body';
}

/**
 * Start a new query with the specified index
 * and types for the query
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-bool-query.html
 *
 * @param  {String} index
 * @param  {Object} [query]
 * @return {Object}
 */
function newQuery(index, query) {
  if (!index) {
    throw new Error('An `index` is required to construct a query');
  }

  if (typeof query === 'undefined') {
    query = {};
  }

  const body = {};

  if (query !== null) {
    body.query = query;
  }

  return {
    index: index,
    type: '_doc',
    body
  };
}

/**
 * Adds a property to the query based on the action provided.
 *
 * @param {Object} query
 * @param {Array|Object} item
 * @param {String} action
 *
 * @return {Object}
 */
function createAction(query, item, action) {
  const key = `${ getRoot(query) }.query.bool.${ action }`,
    data = _.get(query, key, undefined),
    itemIsArray = _.isArray(item);

  if (data) {
    if (itemIsArray) {
      _.set(query, key, data.concat(item));
    } else {
      data.push(item);
      _.set(query, key, data);
    }
  } else {
    if (itemIsArray) {
      _.set(query, key, item);
    } else {
      _.set(query, key, [ item ]);
    }
  }

  return query;
}

/**
 * Adds a `should` property to the query.
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-bool-query.html
 *
 * @param {Object} query
 * @param {Array|Object} item
 * @return {Object}
 */
function addShould(query, item) {
  return createAction(query, item, 'should');
}

/**
 * Adds a `must` property to the query.
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-bool-query.html
 *
 * @param {Object} query
 * @param {Array|Object} item
 * @return {Object}
 */
function addMust(query, item) {
  return createAction(query, item, 'must');
}

/**
 * Adds a `must_not` property to the query.
 *
 * @param {Object} query
 * @param {Array|Object} item
 * @return {Object}
 */
function addMustNot(query, item) {
  return createAction(query, item, 'must_not');
}

/**
 * Add a filter property to a query
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-bool-query.html
 *
 * TODO: HANDLE PASSING IN ARRAY INSTEAD OF SINGLE ITEM
 *
 * @param {Object} query
 * @param {Object} item
 * @return {Object}
 */
function addFilter(query, item) {
  const key = `${ getRoot(query) }.query.bool.filter`,
    filter = _.get(query, key, undefined);

  if (!_.isObject(item)) {
    throw new Error('Filter query required to be an object');
  }

  if (filter) {
    if (_.isArray(filter)) {
      filter.push(item);
      _.set(query, key, filter);
    } else {
      _.set(query, key, [ _.cloneDeep(filter), item ]);
    }
  } else {
    _.set(query, key, item);
  }

  return query;
}

/**
 * Set a minumum number of `should` statements that should match
 * for a query to return items from an index. This function will
 * overwrite previous values for the property if called multiple
 * times.
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-minimum-should-match.html
 *
 * @param {Object} query
 * @param {Number} num
 * @return {Object}
 */
function addMinimumShould(query, num) {
  const key = `${ getRoot(query) }.query.bool.minimum_should_match`;

  if (typeof num !== 'number') {
    throw new Error('A number is required as the second argument');
  }

  _.set(query, key, num);

  return query;
}

/**
 * Add a sort to the query
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/search-request-sort.html
 *
 * @param {Object} query
 * @param {Object} sortItem
 * @return {Object}
 */
function addSort(query, sortItem) {
  var sortBy = _.get(query, 'body.sort');

  if (!_.isArray(sortBy)) {
    sortBy = [];
    _.set(query, 'body.sort', sortBy);
  }

  sortBy.push(sortItem);

  return query;
}

/**
 * Add a size property to the query body
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/search-request-from-size.html
 *
 * @param {Object} query
 * @param {Number|String} [size]
 * @returns {Object}
 */
function addSize(query, size) {
  if (!size && size !== 0) {
    return query;
  }
  size = parseInt(size);
  if (isNaN(size)) {
    throw new Error(`Second argument must be a number: ${ size }`);
  }
  return _.set(query, 'body.size', size);
}

/**
 * Add a from property to the query body
 *
 * @param {Object} query
 * @param {String} offset
 */
function addOffset(query, offset) {
  _.set(query, 'body.from', parseInt(offset));
}

/**
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/search-request-source-filtering.html
 *
 * @param {Object} query
 * @param {Array} fields
 * @returns {Object}
 */
function onlyWithTheseFields(query, fields) {
  if (!_.isArray(fields)) {
    throw new Error('Second argument is required to be an Array');
  }

  _.set(query, 'body._source.include', _.uniq(fields));

  return query;
}

/**
 * @param {Object} query
 * @param {Object} site
 * @returns {Object}
 */
function onlyWithinThisSite(query, site) {
  const prefix = utils.uriToUrl(site.prefix, { site: { protocol: site.proto || 'http' } });

  addFilter(query, { prefix: { canonicalUrl: prefix } });

  return query;
}

/**
 * @param {object} query
 * @param {object} site
 * @returns {object}
 */
function withinThisSiteAndCrossposts(query, site) {
  const prefix = utils.uriToUrl(site.prefix, { site: { protocol: site.proto || 'http' } }),
    prefixFilter = { prefix: { canonicalUrl: prefix } };
  var crosspostFilter = { term: {} },
    shouldFilter = { bool: { should: [], minimum_should_match: 1 } };

  crosspostFilter.term['crosspost.' + site.slug] = true;

  shouldFilter.bool.should.push(prefixFilter);
  shouldFilter.bool.should.push(crosspostFilter);
  addFilter(query, shouldFilter);

  return query;
}

/**
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-mlt-query.html
 * @param {object} query
 * @param {string} id      _id of the elasticsearch document to compare to
 * @param {object} [opts]  provides ability to overwrite any of the options
 * @returns {object}
 */
function moreLikeThis(query, id, opts) {
  const defaultOpts = {
    fields: [ 'tags' ],
    like: {
      _index: query.index, // prefixed index name
      _type: '_doc',
      _id: id
    },
    include: false, // do not include the current doc in the results
    min_term_freq: 1,
    max_query_terms: 12,
    min_doc_freq: 1 // especially helpful for testing few articles
  };

  return {
    more_like_this: Object.assign(defaultOpts, opts)
  };
}

/**
 * Adds aggregation property to query
 * @param {Object} query - Elastic query object
 * @param {Object} options - aggregation config object
 * @returns {Object} query object
 */
function addAggregation(query = {}, options) {
  const { body = {} } = query;

  if (!options) {
    return query;
  }

  if (body.aggs) {

    _.set(query, 'body.aggs', Object.assign(body.aggs, options));
  } else {

    _.set(query, 'body.aggs', options);
  }

  return query;
}

/**
 * Formats aggregation results
 * @param {string} [aggregationName=''] - Aggregation name
 * @param {string} [field=''] - Aggregation result field
 * @param {boolean} [skipEmpty=true] - Remove from the array documents if
 * doc_count is not present or is 0
 * @return {Array<Any>} Array of resulting/expected field from the aggregation
 */
function formatAggregationResults(aggregationName = '', field = '', skipEmpty = true) {
  return function (results = {}) {
    let parsedData = _.get(results, `aggregations.${ aggregationName }.buckets`, []);

    if (skipEmpty) {
      parsedData = parsedData.filter(result => _.get(result, 'doc_count', 0) !== 0);
    }

    return parsedData.map(result => result[field] || '');
  };
}

/**
 * Create a nested query object
 *
 * @param {String} path
 * @return {Object}
 */
function newNestedQuery(path) {
  if (!path) {
    throw new Error('A `path` is required to create a new nested query');
  }

  return {
    nested: {
      path,
      query: {}
    }
  };
}

/**
 * This method exists because the only difference between the client and server
 *   'searchByQuery' calls is the searchByQueryWithRawResult, which those now
 *   pass in.
 *
 * @param  {Object} query
 * @param  {Object} locals
 * @param  {Object} opts - see server/query.js for opts description
 * @param  {function} searchByQueryWithRawResult - a reference to the function
 *   found in either client or server query.js
 * @return {Promise}
 */
function searchByQuery(query, locals, opts, searchByQueryWithRawResult) {
  const formatSearchResult = getFormatSearchResult(opts);

  return searchByQueryWithRawResult(query, locals, opts)
    .then(rawResult => {
      let formattedResult = formatSearchResult(rawResult);

      formattedResult = formatProtocol(formattedResult);

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
 * adds a query_string search on the fields
 *
 * @param {Object} query
 * @param {String} searchTerm
 * @param {String|Array} fields
 *
 * @return {Object}
 */
function addSearch(query, searchTerm, fields) {
  const key = `${ getRoot(query) }.query`,
    value = {
      query_string: {
        query: sanitizeSearchTerm(searchTerm),
        fields: _.isArray(fields) ? fields : [ fields ]
      }
    };

  _.set(query, key, value);

  return query;
}

/**
 * wraps a key and value in an elastic search match object that searches for both the initial value as well as lowercase
 * @param {string} key
 * @param {string} value
 * @returns {{bool: {should: [{match: {}}, {match: {}}], minimum_should_match: number}}}
 */
function matchIgnoreCase(key, value) {
  return {
    bool: {
      should: [
        matchSimple(key, value),
        matchSimple(key, value.toLowerCase())
      ],
      minimum_should_match: 1
    }
  };
}

/**
 * wraps a key and value in an elastic search match object
 * @param {string} key
 * @param {string} value
 * @returns {{match: {}}}
 */
function matchSimple(key, value) {
  return { match: { [key]: value } };
}

/**
 * wraps a key and set of values in an elastic search terms object
 * @param {string} key
 * @param {string[]} values
 * @returns {{terms: {}}}
 */
function terms(key, values) {
  return {
    terms: {
      [key]: values
    }
  };
}

/**
 * for now (for backwards compatibility) this just escapes colons and forward
 *   slashes.  The full list of query special characters is found here:
 *
 *   https://www.elastic.co/guide/en/elasticsearch/reference/6.2/query-dsl-query-string-query.html#_reserved_characters
 *
 * @param {string} searchTerm
 * @returns {string}
 */
function sanitizeSearchTerm(searchTerm) {
  return searchTerm.replace(/([\/|:])/g, '\\$1');
}

module.exports = newQuery;
Object.assign(module.exports, {
  addAggregation,
  addFilter,
  addMinimumShould,
  addMust,
  addMustNot,
  addOffset,
  addSearch,
  addShould,
  addSize,
  addSort,
  formatAggregationResults,
  formatProtocol,
  getFormatSearchResult,
  matchIgnoreCase,
  matchSimple,
  moreLikeThis,
  newNestedQuery,
  onlyWithTheseFields,
  onlyWithinThisSite,
  sanitizeSearchTerm,
  searchByQuery,
  terms,
  withinThisSiteAndCrossposts
});
