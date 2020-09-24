'use strict';

const conditions = require('./conditions'),
  queryService = require('../../../services/universal/query');

/**
 * Applies the filter to the query per the passed in condition type
 *
 * Note: conditionType 'default' should be considered deprecated and remain
 *   as-is for backward compatibility with the frequency feeds.  'Why' is
 *   explained in the commit message.
 *
 * @param {object} query - this is mutated
 * @param {object} filter - the parsed query value from express
 * @param {string} [conditionType] - 'default', 'addShould' or 'addMust'
 */
function applyFilterByType(query, filter, conditionType = 'default') {
  const isDeprecatedFilter = conditionType === 'default';

  for (const [filterKey, filterVal] of Object.entries(filter)) {
    // ?filter[isStationFeed]=true is deprecated.  We should instead
    //   use ?isStationFeed=true
    if (filterKey === 'isStationFeed') {
      continue;
    }

    const aCondition = conditions[filterKey],
      appliedConditionType = isDeprecatedFilter
        ? aCondition.filterConditionType || 'addShould'
        : conditionType;

    // filterVal will be an array in the case where multiple filters are
    //   provided e.g. ?andFilter[tag]=sports&andFilter[tag]=eagles
    if (isDeprecatedFilter || !Array.isArray(filterVal)) {
      addCondition(query, filterVal, aCondition, appliedConditionType);
    } else {
      for (const val of filterVal) {
        addCondition(query, val, aCondition, appliedConditionType);
      }
    }
  }
}

/**
 * Applies the exclude to the query
 *
 * @param {object} query - this is mutated
 * @param {object} exclude - the parsed query value from express
 */
function applyExclude(query, exclude) {
  for (const [excludeKey, excludeVal] of Object.entries(exclude)) {
    const aCondition = conditions[excludeKey];

    addCondition(query, excludeVal, aCondition, 'addMustNot');
  }
}

/**
 * add a condition to the query
 *
 * @param {object} query - the ES query to update
 * @param {*} queryParamVal - this is passed to the condition
 * @param {object} aCondition
 * @param {string} conditionType - possible values addShould/addMust/addMustNot
 */
function addCondition(query, queryParamVal, aCondition, conditionType) {
  const { nested, multiQuery, createObj } = aCondition,
    localQuery = nested
      ? queryService.newNestedQuery(nested)
      : query,
    items = typeof queryParamVal === 'string'
      ? queryParamVal.split(',')
      : [queryParamVal];

  items.forEach(instance => {
    if (multiQuery) {
      createObj(instance).forEach(cond => {
        if (cond.nested) {
          let nestedQuery = queryService.newNestedQuery(cond.nested);

          nestedQuery = queryService[conditionType](nestedQuery, cond);

          const queryOp = conditionType === 'addMustNot'
            ? 'addMust'
            : conditionType;

          queryService[queryOp](localQuery, nestedQuery);
        } else {
          queryService[conditionType](localQuery, cond);
        }
      });
    } else {
      queryService[conditionType](localQuery, createObj(instance));
    }

    if (conditionType === 'addShould') {
      queryService.addMinimumShould(localQuery, 1);
    }
  });

  // add nested queries back into the main query
  if (nested) {
    queryService.addShould(query, localQuery);
    queryService.addMinimumShould(query, 1);
  }
}

/**
 * Applies the filters and excludes passed in the url query
 *
 * @param {object} query - the ES query - this is mutated
 * @param {object} locals
 */
module.exports = (query, locals) => {
  const {
    andFilter = {},
    exclude = {},
    filter = {},
    orFilter = {}
  } = locals;

  applyFilterByType(query, andFilter, 'addMust');
  applyFilterByType(query, filter);
  applyFilterByType(query, orFilter, 'addShould');

  applyExclude(query, exclude);
};
