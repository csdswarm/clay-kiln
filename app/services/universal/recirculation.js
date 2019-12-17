'use strict';
/**
 * @file Wrapper for components that provides default elastic functionality
 * that queries for latest recirculation content.  It also validates any curated
 * content
 */

const _isObject = require('lodash/isObject'),
  queryService = require('../server/query'),
  logger = require('./log'),
  log = logger.setup({ file: __filename }),
  recircCmpt = require('./recirc-cmpt'),
  index = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  returnData = (_, data) => data,
  // Maps defined query filters to correct elastic query formatting
  queryFilters = {
    sectionFronts: {
      filterCondition: 'must',
      createObj: sectionFront => ({ match: { sectionFront } })
    },
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
      log('error', `No filter current exists for ${key}`);
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
        { condition = filterCondition || defaultCondition, value } = _isObject(valueObj) ? valueObj : { value: valueObj };

      if (!createObj || !value) {
        return;
      }

      queryService[getQueryType(condition)](query, createObj(value));
    }
  },

  /**
 * Use filters to query elastic for content
 *
 * @param {object} filter
 * @param {object} exclude
 * @param {array} fields
 * @param {Object} [locals]
 * @returns {array} elasticResults
 */
  fetchRecirculation = async (filter, exclude, fields = elasticFields, locals) => {
    const query = queryService(index, locals);

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
      log('error', 'Error querying Elastic', e);
    }

    return results;
  },
  /**
   * Provides default data rendering and saving for any component using recirculation items
   *
   * @param {object} config
   * @param {string} config.contentKey
   * @param {function} config.mapDataToFilters
   * @param {function} config.render
   * @param {function} config.save
   * @returns {object}
   */
  recirculationData = ({ contentKey = 'articles', mapDataToFilters = returnData, render = returnData, save = returnData }) => {
    return {
      async render(uri, data, locals) {
        try {
          const { filters, excludes } = mapDataToFilters(uri, data, locals),
            content = await fetchRecirculation(filters, excludes, elasticFields, locals);
          
          data[contentKey] = content;
        } catch (e) {
          log('error', `There was an error querying items from elastic - ${e.message}`, e);
        }
        
        return render(uri, data, locals);
      },
      async save(uri, data, locals) {
        if (!data.items.length || !locals) {
          return data;
        }
        data.items = await Promise.all(data.items.map(async (item) => {
          item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
          const result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, elasticFields);
      
          return  {
            ...item,
            primaryHeadline: item.overrideTitle || result.primaryHeadline,
            pageUri: result.pageUri,
            urlIsValid: result.urlIsValid,
            canonicalUrl: item.url || result.canonicalUrl,
            feedImgUrl: item.overrideImage || result.feedImgUrl ,
            sectionFront: result.sectionFront
          };
        }));
  
        return save(uri, data, locals);
      }
    };
  };

module.exports.recirculationData = recirculationData;
