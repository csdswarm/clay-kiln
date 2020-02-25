'use strict';
/**
 * @file Wrapper for components that provides default elastic functionality
 * that queries for latest recirculation content.  It also validates any curated
 * content
 *
 * Curated content should be saved to data.items
 *
 * Component expects the following fields in the schema.yml
 * populateFrom
 * contentType
 * sectionFront - (use sectionFrontManual if sectionFront is using subscribe)
 * secondarySectionFront - (use secondarySectionFrontManual if secondarySectionFront is using subscribe)
 * tags - (use tagsManual if tags is using subscribe)
 * excludeSectionFronts
 * excludeSecondarySectionFronts
 * excludeTags
 */

const _get = require('lodash/get'),
  _pick = require('lodash/pick'),
  _isPlainObject = require('lodash/isPlainObject'),
  { isComponent } = require('clayutils'),
  { cleanUrl } = require('../../services/universal/utils'),
  queryService = require('../server/query'),
  { unityComponent } = require('../universal/amphora'),
  logger = require('./log'),
  log = logger.setup({ file: __filename }),
  recircCmpt = require('./recirc-cmpt'),
  index = 'published-content',
  DEFAULT_CONTENT_KEY = 'articles',
  DEFAULT_ELASTIC_FIELDS = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  DEFAULT_MAX_ITEMS = 10,
  DEFAULT_PAGE_LENGTH = 5,
  returnData = (_, data) => data,
  defaultMapDataToFilters = (ref, data, locals) => ({
    filters: {
      ...getAuthor(data, locals),
      contentTypes: boolObjectToArray(data.contentType),
      ..._pick({
        sectionFronts: sectionOrTagCondition(data.populateFrom, data.sectionFrontManual || data.sectionFront),
        secondarySectionFronts: sectionOrTagCondition(data.populateFrom, data.secondarySectionFrontManual || data.secondarySectionFront),
        tags: sectionOrTagCondition(data.populateFrom, getTag(data, locals))
      }, populateFilter(data.populateFrom))
    },
    excludes: {
      canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
      sectionFronts: boolObjectToArray(data.excludeSectionFronts),
      secondarySectionFronts: boolObjectToArray(data.excludeSecondarySectionFronts),
      tags: (data.excludeTags || []).map(tag => tag.text)
    },
    curated: data.items || []
  }),
  defaultTemplate = (validatedItem, curatedItem = {}) => ({
    ...curatedItem,
    primaryHeadline: curatedItem.overrideTitle || validatedItem.primaryHeadline,
    pageUri: validatedItem.pageUri,
    urlIsValid: validatedItem.urlIsValid,
    canonicalUrl: curatedItem.url || validatedItem.canonicalUrl,
    feedImgUrl: curatedItem.overrideImage || validatedItem.feedImgUrl ,
    sectionFront: validatedItem.sectionFront
  }),
  // Maps defined query filters to correct elastic query formatting
  queryFilters = {
    author: {
      createObj: author => ({ match: { 'authors.normalized': author } })
    },
    canonicalUrls: { createObj: canonicalUrl => ({ match: { canonicalUrl } }) },
    contentTypes: {
      filterCondition: 'must',
      unique: true,
      createObj: contentType => ({ match: { contentType } })
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
    }
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
      log('error', `No filter current exists for ${key}`);
      return;
    }

    const { createObj, filterCondition, unique } = queryFilters[key],
      { condition = conditionOverride || filterCondition, value } = _isPlainObject(valueObj) ? valueObj : { value: valueObj };

    if (Array.isArray(value)) {
      if (unique && value.length) {
        queryService[getQueryType(condition)](query, minimumShouldMatch(value.map(createObj)));
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
   * Pull author from locals
   *
   * @param {object} data
   * @param {object} locals
   *
   * @return {string} author
   */
  getAuthor = (data, locals) => {
    let author;

    if (locals && locals.author) {
      // This is from load more on an author page
      author = locals.author;
    } else if (locals && locals.params && locals.params.author) {
      // This is from an author page
      author = locals.params.author;
    } else if (locals && locals.params && locals.params.dynamicAuthor) {
      // This is from an dynamic author page
      author = locals.params.dynamicAuthor;
    }

    return { author };
  },
  /**
   * Pull tags from locals or data whether a static or dynamic tag page
   *
   * @param {object} data
   * @param {object} locals
   *
   * @return {array} tags
   */
  getTag = (data, locals) => {
    let tags = data.tagManual || data.tag;

    // Check if we are on a tag page and override the above
    if (locals && locals.tag) {
      // This is from load more on a tag page
      tags = locals.tag;
    } else if (locals && locals.params && locals.params.tag) {
      // This is from a tag page but do not override a manually set tag
      tags = data.tag || locals.params.tag;
    } else if (locals && locals.params && locals.params.dynamicTag) {
      // This is from a tag page
      tags = locals.params.dynamicTag;
    }

    // normalize tag array (based on simple list input)
    if (Array.isArray(tags)) {
      tags = tags.map(tag => tag.text);
    }

    // split comma seperated tags (for load-more get queries)
    if (typeof tags == 'string' && tags.indexOf(',') > -1) {
      tags = tags.split(',');
    }

    if (tags === '') {
      return [];
    }

    return tags;
  },
  /**
   * Determine which sectionFront/tag values to consider based on where the populateFrom value
   *
   * @param {string} populateFrom
   *
   * @returns {array}
   */
  populateFilter = populateFrom => {
    const sectionFronts = ['sectionFronts', 'secondarySectionFronts'],
      tags = ['tags'];

    switch (populateFrom) {
      case 'tag':
        return tags;
      case 'section-front':
        return sectionFronts;
      case 'all-content':
        return [];
      default:
        return [...sectionFronts, ...tags];
    }
  },
  /**
   * Query condition needs to be should if populateFrom = section-front-or-tag
   *
   * @param {string} populateFrom
   * @param {any} value
   *
   * @returns {object}
   */
  sectionOrTagCondition = (populateFrom, value) => populateFrom === 'section-front-or-tag' ? { condition: 'should', value } : value,
  /**
   * Verify the url exists and is not a component
   *
   * @param {string} url
   *
   * @returns {boolean}
   */
  validUrl = url => url && !isComponent(url),
  boolObjectToArray = (obj) => Object.entries(obj || {}).map(([key, bool]) => bool && key).filter(value => value),

  /**
 * Use filters to query elastic for content
 *
 * @param {object} config.filter
 * @param {object} config.exclude
 * @param {array} config.fields
 * @param {object} config.pagination
 * @param {number} config.maxItems
 * @param {Object} [locals]
 * @returns {array} elasticResults
 */
  fetchRecirculation = async ({ filters, excludes, elasticFields, maxItems }, locals) => {
    const query = queryService.newQueryWithCount(index, maxItems + 1, locals),
      searchOpts = { shouldDedupeContent: true };

    // Pagination is currently remove since deduping naturally adds pagination.
    //
    // const { page, pageLength = DEFAULT_PAGE_LENGTH } = pagination,
    //   offset = maxItems + (parseInt(page) - 1) * pageLength;

    // if (page) {
    //   queryService.addOffset(query, offset);
    // }

    let results = [];

    // add sorting
    queryService.addSort(query, { date: 'desc' });

    Object.entries(filters).forEach(([key, value]) => addCondition(query, key, value));
    Object.entries(excludes).forEach(([key, value]) => addCondition(query, key, value, 'mustNot'));

    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);

    // If there is a should query, there needs to be a minimum_should_match
    if (_get(query, 'body.query.bool.should')) {
      query.body.query.bool.minimum_should_match = 1;
    }

    try {
      results = await queryService.searchByQuery(query, locals, searchOpts);
    } catch (e) {
      queryService.logCatch(e, 'content-search');
      log('error', 'Error querying Elastic', e);
    }

    return results;
  },
  /**
   * Provides default data rendering and saving for any component using recirculation items
   *
   * @param {object} [config]
   * @param {string} [config.contentKey]
   * @param {array} [config.elasticFields]
   * @param {number} [config.maxItems]
   * @param {function} [config.mapDataToFilters]
   * @param {function} [config.mapResultsToTemplate]
   * @param {function} [config.render]
   * @param {function} [config.save]
   * @returns {object}
   */
  recirculationData = ({
    contentKey = DEFAULT_CONTENT_KEY,
    elasticFields = DEFAULT_ELASTIC_FIELDS,
    maxItems = DEFAULT_MAX_ITEMS,
    mapDataToFilters = returnData,
    mapResultsToTemplate = defaultTemplate,
    render = returnData,
    save = returnData,
    skipRender = () => false } = {}) => {
    return unityComponent({
      async render(uri, data, locals) {
        const curatedIds = data.items.map(anItem => anItem.uri);

        locals.loadedIds = locals.loadedIds.concat(curatedIds);

        if (skipRender(data, locals)) {
          return render(uri, data, locals);
        }

        try {
          const { filters = {}, excludes = {}, pagination = {}, curated } = {
              ...defaultMapDataToFilters(uri, data, locals),
              ...await mapDataToFilters(uri, data, locals)
            },
            content = await fetchRecirculation({ filters, excludes, elasticFields, pagination, maxItems }, locals);

          data._computed = Object.assign(data._computed || {}, {
            [contentKey]: [...curated, ...content].slice(0, maxItems).map(item => mapResultsToTemplate(item)),
            initialLoad: !pagination.page,
            moreContent: content.length > maxItems
          });
        } catch (e) {
          log('error', `There was an error querying items from elastic - ${e.message}`, e);
        }
        return render(uri, data, locals);
      },
      async save(uri, data, locals) {
        if (!data.items.length || !locals) {
          return save(uri, data, locals);
        }

        data.items = await Promise.all(data.items.map(async (item) => {
          item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
          const searchOpts = {
              includeIdInResult: true,
              shouldDedupeContent: false
            },
            result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, elasticFields, searchOpts);

          return mapResultsToTemplate(result, item);
        }));

        return save(uri, data, locals);
      }
    });
  };

module.exports = {
  recirculationData
};
