'use strict';

const _clone = require('lodash/clone'),
  _map = require('lodash/map'),
  queryService = require('../../services/server/query'),
  { sendError, elasticCatch } = require('../../services/universal/cmpt-error'),
  { formatStart } = require('../../services/universal/utils'),
  index = 'published-articles';

/**
 * Builds and executes the query.
 * @param {string} routeParamValue
 * @param {object} data
 * @param {object} locals
 * @return {object}
 */
function buildAndExecuteQuery(routeParamValue, data, locals) {
  const from = formatStart(parseInt(locals.start, 10)), // can be undefined or NaN,
    size = parseInt(locals.size, 10) || data.size || 20,
    body = {
      from,
      size
    },
    query = queryService(index, locals);

  query.body = _clone(body); // lose the reference

  queryService.onlyWithinThisSite(query, locals.site);

  if (routeParamValue) {
    queryService.addShould(query, { match: { 'tags.normalized': routeParamValue } });
  }

  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, { date: 'desc' });

  return queryService.searchByQueryWithRawResult(query)
    .then(function (results) {
      const { hits = {} } = results;

      data.total = hits.total;
      data.entries = _map(hits.hits, '_source');
      data.from = from;
      data.start = from + size;
      data.moreEntries = data.total > data.start;

      return data;
    });
}

module.exports.render = (ref, data, locals) => {
  var routeParamValue;

  // If we're publishing for a dynamic page, quick return
  if (locals.isDynamicPublishUrl) {
    return data;
  }

  if (!data.routeParam) {
    throw new Error('dynamic-list component requires a `routeParam` to be defined');
  }

  routeParamValue = locals && locals.params ? locals.params[data.routeParam] : '';

  return buildAndExecuteQuery(routeParamValue, data, locals)
    .then(data => {
      // If we're not in edit mode and we've
      // got no results, the page should 404
      if (!data.entries.length && !locals.edit) {
        sendError(`No results for tag: ${routeParamValue}`, 404);
      }

      return data;
    })
    .catch(elasticCatch);
};

module.exports.save = (ref, data) => {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
