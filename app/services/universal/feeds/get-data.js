'use strict';
const
  _get = require('lodash/get'),
  {
    addFilter,
    addMinimumShould,
    addMust,
    addMustNot,
    addOffset,
    addShould,
    addSort,
    newQueryWithCount,
    onlyWithinThisSite,
    onlyWithTheseFields,
    searchByQuery
  } = require('../../server/query');

/**
 * Takes query parameters and uses them to run an elastic search
 * @param {object} params
 * @param {string[]} params.fields fields to return
 * @param {object?} params.filter
 * @param {string} params.index elastic index to search
 * @param {number} params.limit the max number of results to return
 * @param {object[]} params.mustNots matches that must not appear in the results
 * @param {object[]} params.musts matches that must appear in the results
 * @param {number?} params.offset the point where the query should begin returning values when paging occurs
 * @param {object[]} params.shoulds matches that should appear in the results
 * @param {object} params.site
 * @param {object?} params.sort the field and direction to sort on
 * @returns {Promise|*}
 */
module.exports = function (params) {
  const {
      fields,
      filter,
      index,
      limit,
      mustNots = [],
      musts = [],
      offset,
      shoulds = [],
      site,
      sort = { date: 'desc' }
    } = params,

    query = newQueryWithCount(index, limit, { site });

  if (filter) {
    addFilter(query, filter);
  }

  onlyWithinThisSite(query, site);
  onlyWithTheseFields(query, fields);

  if (offset) {
    addOffset(query, offset);
  }

  for (const must of musts) {
    addMust(query, must);
  }

  for (const should of shoulds) {
    addShould(query, should);
  }

  for (const mustNot of mustNots) {
    addMustNot(query, mustNot);
  }

  if (_get(query, 'body.query.bool.should[0]')) {
    addMinimumShould(query, 1);
  }

  addSort(query, sort);

  return searchByQuery(query);
};
