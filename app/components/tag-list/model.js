'use strict';

const queryService = require('../../services/server/query'),
  formatStart = require('../../services/universal/utils').formatStart,
  _pickBy = require('lodash/pickBy'),
  _clone = require('lodash/clone'),
  _assign = require('lodash/assign'),
  _get = require('lodash/get'),
  _map = require('lodash/map'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'newsfeed'
  });

module.exports.render = (ref, data, locals) => {
  const from = formatStart(parseInt(locals.start, 10)), // can be undefined or NaN,
    size = parseInt(locals.size, 10) || data.size || 10,
    body = _pickBy({
      from: from,
      size: size
    }),
    query = queryService(data.index, locals),
    tagValue = locals.params.tag;

  query.body = _clone(body); // lose the reference

  queryService.addSort(query, {
    [`${data.orderBy}`]: 'desc'
  });


  if (locals.params.tag || overrideTag) {// eslint-disable-line no-undef
    queryService.addFilter(query, { term: { tags: tagValue }});
  }

  // Log the query
  log('debug', 'query for newsfeed cmpt', {
    query,
    ref
  });

  return queryService.searchByQueryWithRawResult(query)
    .then(function (results) {
      _assign(data, body);
      data.total = _get(results, 'hits.total');
      data.entries = _map(_get(results, 'hits.hits'), '_source');
      data.from = from;
      data.start = from + size;

      if (!data.entries.length) {
        let err = new Error('No results!');

        err.status = 404;
        throw err;
      }

      data.title = data.title.replace('${tagValue}', tagValue);

      return data;
    });
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
