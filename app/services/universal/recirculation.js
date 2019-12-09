'use strict';

const _isObject = require('lodash/isObject'),
  queryService = require('../server/query'),
  index = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  // Maps defined query filters to correct elastic query formatting
  queryFilters = {
    sectionFronts: { createObj: sectionFront => ({ match: { sectionFront } }) },
    secondarySectionFronts: { createObj: secondarySectionFront => ({ match: { secondarySectionFront } }) },
    tags: { createObj: tag => ({ match: { 'tags.normalized': tag } }) },
    contentTypes: {
      filterCondition: 'must',
      multipleCondition: 'should',
      createObj: contentType => ({ match: { contentType } })
    },
    canonicalUrls: { createObj: canonicalUrl => ({ match: { canonicalUrl } }) }
  },
  /**
   * Transform condition to queryService method name
   *
   * @param {string} condition
   * @returns {string}
   */
  getQueryType = condition => {
    switch (condition) {
      case 'must':
        return 'addMust';
      case 'mustNot':
        return 'addMustNot';
      default:
        return 'addShould';
    }
  },
  /**
   * Add to bool query portion of elastic query
   *
   * @param {object} query
   * @param {string} key
   * @param {string | object} valueObj,
   * @param {string} defaultCondition
   */
  addCondition = (query, key, valueObj, defaultCondition) => {
    if (!queryFilters[key]) {
      console.error(`No filter current exists for ${key}`);
      return;
    }

    if (!valueObj) {
      return;
    }

    if (Array.isArray(valueObj)) {
      const { filterCondition, multipleCondition } = queryFilters[key],
        arrayCondition = valueObj.length > 1 ? multipleCondition : filterCondition || defaultCondition;

      valueObj.forEach(v => addCondition(query, key, v, arrayCondition));
    } else {
      const { createObj, filterCondition } = queryFilters[key],
        { condition = defaultCondition || filterCondition, value } = _isObject(valueObj) ? valueObj : { value: valueObj };

      if (!createObj || !value) {
        return;
      }

      queryService[getQueryType(condition)](query, createObj(value));
    }
  };

/**
 * Use filters to query elastic for content
 *
 * @param {object} filter
 * @param {object} exclude
 * @param {array} fields
 * @returns {array} elasticResults
 */
module.exports = async (filter, exclude, fields = elasticFields) => {
  const query = queryService(index);

  let results = [];
  
  // add sorting
  queryService.addSort(query, { date: 'desc' });

  Object.entries(filter).forEach(([key, value]) => addCondition(query, key, value));
  Object.entries(exclude).forEach(([key, value]) => addCondition(query, key, value, 'mustNot'));

  queryService.onlyWithTheseFields(query, fields);

  try {
    results = await queryService.searchByQuery(query);
  } catch (e) {
    queryService.logCatch(e, 'content-search');
    console.error(e);
  }

  return results;
};
