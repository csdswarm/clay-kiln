'use strict';

const _castArray = require('lodash/castArray'),
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  applyConditions = require('./apply-conditions'),
  serverQuery = require('../../services/server/query'),
  universalQuery = require('../../services/universal/query');

/**
 * This filters content that was created for RDC only, any content created with a station will be excluded.
 * @param {object} query - this parameter is mutated
 */
function restrictToRDC(query) {
  const pathToFilter = 'body.query.bool.must',
    // if the current filter is an object then we need to put it inside an array
    //   because we're adding an additional one
    filter = _castArray(_get(query, pathToFilter, []));

  _set(query, pathToFilter, filter);

  filter.push({
    bool: {
      should: [
        { match: { stationSlug: '' } },
        { bool: { must_not: { exists: { field: 'stationSlug' } } } }
      ],
      minimum_should_match: 1
    }
  });
}

module.exports = (data, locals) => {
  let query = data.query.query
    ? data.query.query
    : null;

  query = serverQuery(data.index, locals, query);

  const filters = locals.filter || {},
    { andFilter, filter, orFilter } = locals,
    sizeToAdd = filters.size
      ? filters.size
      : data.query.size;

  universalQuery.addSize(query, sizeToAdd);
  universalQuery.addSort(query, data.query.sort);

  if (data.query._source) {
    universalQuery.onlyWithTheseFields(query, data.query._source);
  }

  applyConditions(query, locals);

  if (!andFilter && !filter && !orFilter) {
    restrictToRDC(query);
  }

  return query;
};
