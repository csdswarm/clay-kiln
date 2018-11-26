'use strict';

const queryService = require('../../services/server/query'),
  _map = require('lodash/map'),
  { isPage, isComponent } = require('clayutils'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'newsfeed'
  }),
  index = 'published-articles',
  maxItems = 10,
  pageLength = 5;

/**
 * Builds and executes the query.
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @param {string} routeParamValue
 * @return {object}
 */
function buildAndExecuteQuery(ref, data, locals, routeParamValue) {
  const query = queryService.newQueryWithCount(index, maxItems);

  if (routeParamValue) {
    queryService.addFilter(query, { match: { 'tags.normalized': routeParamValue } });
  }

  queryService.addSort(query, { date: 'desc' });

  if (locals && locals.page ) {
    /* after the first 10 items, show N more at a time (pageLength defaults to 5)
     * page = 1 would show items 10-15, page = 2 would show 15-20, page = 0 would show 1-10
     * we return N + 1 items so we can let the frontend know if we have more data.
     */
    if (!data.pageLength) { data.pageLength = pageLength; }
    const skip = maxItems + (parseInt(locals.page) - 1) * data.pageLength;

    queryService.addOffset(query, skip);
    queryService.addSize(query, data.pageLength);
  }

  // Log the query
  if (locals.params && locals.params.log) {
    log('debug', 'tag', {
      tag: routeParamValue,
      ref
    });
  }

  return queryService.searchByQueryWithRawResult(query)
    .then(function (results) {
      const { hits = {} } = results,
        // max number we could currently be displaying
        offset = locals.page ? parseInt(locals.page) * data.pageLength : 0,
        // added to the initial number items to display
        currentDisplayed = maxItems + offset;

      data.total = hits.total;
      data.content = _map(hits.hits, '_source');
      data.moreContent = data.total > currentDisplayed;

      if (locals.params && locals.params.log) {
        log('debug', 'total hits', {
          hits: hits.total,
          ref
        });
      }

      return data;
    });
}

module.exports.render = (ref, data, locals) => {
  const reqUrl = locals.url;

  if (locals.params && locals.params.log) {
    log('debug', 'request URL', {
      hits: reqUrl,
      ref
    });
  }

  // If we're publishing for a dynamic page, rendering a component directly
  // or trying to render a page route we need a quick return
  // unless it is for getting additional content
  if (!locals.page && (locals.isDynamicPublishUrl || isComponent(reqUrl) || isPage(reqUrl))) {
    return data;
  }

  data.dynamicTag = locals && locals.params ? locals.params.tag : locals.tag;

  return buildAndExecuteQuery(ref, data, locals, data.dynamicTag)
    .then(data => {
      // If we're not in edit mode and we've
      // got no results, the page should 404
      if (!data.content.length && !locals.edit) {
        let err = new Error(`No results for tag: ${data.dynamicTag}`);

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
