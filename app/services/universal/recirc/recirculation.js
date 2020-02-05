'use strict';
/**
 * @file Wrapper for components that provides default elastic functionality
 * that queries for latest recirculation content.  It also validates any curated
 * content
 */

const
  _has = require('lodash/has'),
  _isPlainObject = require('lodash/isPlainObject'),
  logger = require('../log'),
  queryService = require('../../server/query'),
  recircCmpt = require('./recirc-cmpt'),
  { unityComponent } = require('../amphora'),

  log = logger.setup({ file: __filename }),
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
    author: {
      filterCondition: 'must',
      createObj: author => ({ match: { 'authors.normalized': author } })
    },
    sectionFronts: {
      filterCondition: 'must',
      unique: true,
      createObj: sectionFront => ({ match: { sectionFront } })
    },
    secondarySectionFronts: { createObj: secondarySectionFront => ({ match: { secondarySectionFront } }) },
    tags: {
      unique: true,
      createObj: tag => ({ match: { 'tags.normalized': tag } })
    },
    contentTypes: {
      filterCondition: 'must',
      unique: true,
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
   * Convert array to a bool query with a minimum should match
   *
   * @param {array} queries
   * @param {number} minimum_should_match
   * @returns {object}
   */
  minimumShouldMatch = (queries, minimum_should_match = 1) => ({ bool: { should: queries, minimum_should_match } }),
  /**
   * Add to bool query portion of elastic query
   *
   * @param {object} query
   * @param {string} key
   * @param {string | object} valueObj,
   * @param {string} conditionOverride
   */
  addCondition = (query, key, valueObj, conditionOverride) => {
    if (!queryFilters[key]) {
      log('error', `No filter current exists for ${ key }`);
      return;
    }

    const { createObj, filterCondition, unique } = queryFilters[key],
      { condition = conditionOverride || filterCondition, value } = _isPlainObject(valueObj)
        ? valueObj
        : { value: valueObj };

    if (Array.isArray(value)) {
      if (unique) {
        const queries = value.map(createObj);

        if (queries.length) {
          queryService[getQueryType(condition)](query, minimumShouldMatch(queries));
        }
      } else {
        value.forEach(v => addCondition(query, key, v, condition));
      }
    } else {
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

    Object.entries(filter).forEach(([ key, value ]) => addCondition(query, key, value));
    Object.entries(exclude).forEach(([ key, value ]) => addCondition(query, key, value, 'mustNot'));

    queryService.onlyWithTheseFields(query, fields);

    // If there is a should query, there needs to be a minimum_should_match
    if (_has(query, 'body.query.bool.should[0]')) {
      query.body.query.bool.minimum_should_match = 1;
    }

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
  recirculationData = ({ contentKey = 'articles', maxItems = 6, mapDataToFilters = returnData, render = returnData, save = returnData }) =>
    unityComponent({
      async render(uri, data, locals) {

        try {
          const { filters, excludes, curated } = mapDataToFilters(uri, data, locals),
            content = await fetchRecirculation(filters, excludes, elasticFields, locals);

          data._computed = Object.assign(data._computed || {}, {
            [contentKey]: [ ...curated, ...content ].slice(0, maxItems)
          });
        } catch (e) {
          log('error', `There was an error querying items from elastic - ${ e.message }`, e);
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

          return {
            ...item,
            primaryHeadline: item.overrideTitle || result.primaryHeadline,
            pageUri: result.pageUri,
            urlIsValid: result.urlIsValid,
            canonicalUrl: item.url || result.canonicalUrl,
            feedImgUrl: item.overrideImage || result.feedImgUrl,
            sectionFront: result.sectionFront
          };
        }));

        return save(uri, data, locals);
      }
    });

module.exports.recirculationData = recirculationData;
