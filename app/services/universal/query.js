'use strict';

const _ = require('lodash'),
  utils = require('../universal/utils');

/**
 * @param {object} result
 * @returns {Array}
 */
function formatSearchResult(result) {
  return _.map(result.hits.hits, '_source');
}

/**
 * Start a new query with the specified index
 * and types for the query
 * https://www.elastic.co/guide/en/elasticsearch/reference/2.4/query-dsl-bool-query.html
 *
 * @param  {String} index
 * @param  {String} type
 * @return {Object}
 */
function newQuery(index) {
  if (!index) {
    throw new Error('An `index` is required to construct a query');
  }

  return {
    index: index,
    type: '_doc',
    body: {
      query: {}
    }
  };
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
  var should = _.get(query, 'body.query.bool.should', undefined),
    itemIsArray = _.isArray(item);

  if (should) {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.should', should.concat(item));
    } else {
      should.push(item);
      _.set(query, 'body.query.bool.should', should);
    }
  } else {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.should', item);
    } else {
      _.set(query, 'body.query.bool.should', [item]);
    }
  }

  return query;
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
  var must = _.get(query, 'body.query.bool.must', undefined),
    itemIsArray = _.isArray(item);

  if (must) {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.must', must.concat(item));
    } else {
      must.push(item);
      _.set(query, 'body.query.bool.must', must);
    }
  } else {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.must', item);
    } else {
      _.set(query, 'body.query.bool.must', [item]);
    }
  }

  return query;
}

/**
 * Adds a `must_not` property to the query.
 *
 * @param {Object} query
 * @param {Array|Object} item
 * @return {Object}
 */
function addMustNot(query, item) {
  var mustNot = _.get(query, 'body.query.bool.must_not', undefined),
    itemIsArray = _.isArray(item);

  if (mustNot) {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.must_not', mustNot.concat(item));
    } else {
      mustNot.push(item);
      _.set(query, 'body.query.bool.must_not', mustNot);
    }
  } else {
    if (itemIsArray) {
      _.set(query, 'body.query.bool.must_not', item);
    } else {
      _.set(query, 'body.query.bool.must_not', [item]);
    }
  }

  return query;
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
  var filter = _.get(query, 'body.query.bool.filter', undefined),
    itemIsObject = _.isObject(item);

  if (!itemIsObject) {
    throw new Error('Filter query required to be an object');
  }

  if (filter) {
    if (_.isArray(filter)) {
      filter.push(item);
      _.set(query, 'body.query.bool.filter', filter);
    } else {
      _.set(query, 'body.query.bool.filter', [ _.cloneDeep(filter), item ] );
    }
  } else {
    _.set(query, 'body.query.bool.filter', item);
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
  if (typeof num !== 'number') {
    throw new Error('A number is required as the second argument');
  }

  _.set(query, 'body.query.bool.minimum_should_match', num);

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
    throw new Error(`Second argument must be a number: ${size}`);
  }
  return _.set(query, 'body.size', size);
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
  const prefix = utils.uriToUrl(site.prefix, {site: {protocol: site.proto || 'http', port: site.port}});

  addFilter(query, {prefix: {canonicalUrl: prefix}});

  return query;
}

/**
 * @param {object} query
 * @param {object} site
 * @returns {object}
 */
function withinThisSiteAndCrossposts(query, site) {
  const prefix = utils.uriToUrl(site.prefix, {site: {protocol: site.proto || 'http', port: site.port}}),
    prefixFilter = {prefix: {canonicalUrl: prefix}};
  var crosspostFilter = {term: {}},
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
  let defaultOpts = {
    fields: ['tags'],
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
  const {body = {}} = query;

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
    let parsedData = _.get(results, `aggregations.${aggregationName}.buckets`, []);

    if (skipEmpty) {
      parsedData = parsedData.filter(result => _.get(result, 'doc_count', 0) !== 0);
    }

    return parsedData.map(result => result[field] || '');
  };
}

module.exports = newQuery;
module.exports.addAggregation = addAggregation;
module.exports.addShould = addShould;
module.exports.addFilter = addFilter;
module.exports.addMust = addMust;
module.exports.addMustNot = addMustNot;
module.exports.addMinimumShould = addMinimumShould;
module.exports.addSort = addSort;
module.exports.addSize = addSize;
module.exports.onlyWithTheseFields = onlyWithTheseFields;
module.exports.onlyWithinThisSite = onlyWithinThisSite;
module.exports.withinThisSiteAndCrossposts = withinThisSiteAndCrossposts;
module.exports.formatAggregationResults = formatAggregationResults;
module.exports.formatSearchResult = formatSearchResult;
module.exports.moreLikeThis = moreLikeThis;
