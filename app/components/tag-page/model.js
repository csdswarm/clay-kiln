'use strict';

const queryService = require('../../services/server/query'),
  formatStart = require('../../services/universal/utils').formatStart,
  _clone = require('lodash/clone'),
  _map = require('lodash/map'),
  { isPage, isComponent } = require('clayutils'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'newsfeed'
  }),
  index = 'published-articles';

function removeNonAlphanumericCharacters(str = '') {
  return str.replace(/[_\W]/g, '');
}

/**
 * Builds and executes the query.
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @param {string} routeParamValue
 * @return {object}
 */
function buildAndExecuteQuery(ref, data, locals, routeParamValue) {
  const from = formatStart(parseInt(locals.start, 10)), // can be undefined or NaN,
    size = parseInt(locals.size, 10) || data.size || 20,
    body = {
      from,
      size
    },
    query = queryService(index, locals);

  let lowerCaseRouteParamValue = '';

  query.body = _clone(body); // lose the reference

  if (routeParamValue) {
    lowerCaseRouteParamValue = removeNonAlphanumericCharacters(routeParamValue).toLowerCase();
    queryService.addFilter(query, { match: { 'tags.normalized': lowerCaseRouteParamValue } });
  }

  // Log the query
  log('debug', 'tag and normalized tag ', {
    normalized: lowerCaseRouteParamValue,
    tag: routeParamValue,
    ref
  });

  queryService.addSort(query, { date: 'desc' });

  return queryService.searchByQueryWithRawResult(query)
    .then(function (results) {
      const { hits = {} } = results;

      data.total = hits.total;
      data.entries = _map(hits.hits, '_source');
      data.from = from;
      data.start = from + size;
      data.moreEntries = data.total > data.start;

      log('debug', 'total hits', {
        hits: hits.total,
        ref
      });

      return data;
    });
}


module.exports.render = (ref, data, locals) => {
  const reqUrl = locals.url;
  var routeParamValue;

  log('debug', 'request URL', {
    hits: reqUrl,
    ref
  });

  // If we're publishing for a dynamic page, rendering a component directly
  // or trying to render a page route we need a quick return
  if (locals.isDynamicPublishUrl || isComponent(reqUrl) || isPage(reqUrl)) {
    return data;
  }

  routeParamValue = locals && locals.params ? locals.params.tag : '';
  data.dynamicTag = routeParamValue;

  return buildAndExecuteQuery(ref, data, locals, routeParamValue)
    .then(data => {
      // If we're not in edit mode and we've
      // got no results, the page should 404
      if (!data.entries.length && !locals.edit) {
        let err = new Error(`No results for tag: ${routeParamValue}`);

        err.status = 404;
        throw err;
      }

      return data;
    })
    .catch(err => {
      throw err;
    });
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
