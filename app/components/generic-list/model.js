'use strict';

const _map = require('lodash/map'),
  yaml = require('js-yaml'),
  queryService = require('../../services/server/query'),
  { sendError, elasticCatch } = require('../../services/universal/cmpt-error'),
  { formatStart, isPublishedVersion } = require('../../services/universal/utils'),
  { hypensToSpaces, titleCase } = require('../../services/universal/dynamic-route-param'),
  TABS_RE = /\t/g;

/**
 * Builds and executes the query.
 * @param {object} data
 * @param {object} locals
 * @return {object}
 */
function buildAndExecuteQuery(data, locals = {}) {
  const from = formatStart(parseInt(locals.start, 10)), // can be undefined or NaN,
    query = queryService(data.index, locals),
    size = data.size;

  query.body = {};

  if (data.query) {
    query.body = data.jsonQuery;
  }

  query.body.size = size;
  query.body.from = from;
  query.body._source = data._source;

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
/**
 * Gets the text value from a simple list
 * @param {Object[]} arr
 * @return {string[]}
 */
function getSimpleListValues(arr = []) {
  return arr.map(element => element.text);
}

function getEntries(ref, data, locals = {}) {
  return buildAndExecuteQuery(data, locals)
    .then(data => {
      // If we're not in edit mode and
      // the page is published and
      // we've got no results, the page should 404
      if (!data.entries.length && !locals.edit && isPublishedVersion(ref)) {
        sendError('No results', 404);
      }

      return data;
    })
    .catch((e) =>{
      if (!locals.edit) {
        elasticCatch(e);
      }

      return data;
    });
}

module.exports.render = (ref, data, locals) => {
  return getEntries(ref, data, locals).then(data => data);
};

module.exports.save = (ref, data, locals) => {
  data.index = data.index || 'published-articles';
  data._source = data.source && data.source.length ? getSimpleListValues(data.source) : [];
  data.title = data.index ? titleCase(hypensToSpaces(data.index)) : '';

  // make sure all of the numbers we need to save aren't strings
  data.size = parseInt(data.size, 10) || 10;
  data.adIndex = parseInt(data.adIndex, 10) || 9;

  if (data.query) {
    // js-yaml doesn't like tabs so we replace them with 2 spaces
    data.query = data.query.replace(TABS_RE, '  ');
    data.jsonQuery = yaml.safeLoad(data.query);
  }

  return getEntries(ref, data, locals).then(data => data);
};
