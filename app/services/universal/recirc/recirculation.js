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

const
  _merge = require('lodash/merge'),
  _get = require('lodash/get'),
  _has = require('lodash/has'),
  _isEmpty = require('lodash/isEmpty'),
  _isPlainObject = require('lodash/isPlainObject'),
  _pick = require('lodash/pick'),
  logger = require('../log'),
  queryService = require('../../server/query'),
  recircCmpt = require('./recirc-cmpt'),
  { addAmphoraRenderTime, cleanUrl, boolObjectToArray } = require('../utils'),
  { DEFAULT_STATION } = require('../constants'),
  { isComponent } = require('clayutils'),
  { syndicationUrlPremap } = require('../syndication-utils'),
  { unityComponent } = require('../amphora'),

  log = logger.setup({ file: __filename }),
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
  returnData = (_, data) => data,
  defaultMapDataToFilters = (ref, data, locals) => ({
    filters: {
      ...getAuthor(data, locals),
      ...getHost(data, locals),
      contentTypes: boolObjectToArray(data.contentType),
      ..._pick({
        sectionFronts: sectionOrTagCondition(data.populateFrom, data.sectionFrontManual || data.sectionFront),
        secondarySectionFronts: sectionOrTagCondition(data.populateFrom, data.secondarySectionFrontManual || data.secondarySectionFront),
        tags: sectionOrTagCondition(data.populateFrom, getTag(data, locals))
      }, populateFilter(data.populateFrom)),
      ...{ stationSlug: getStationSlug(locals) }
    },
    excludes: {
      canonicalUrls: [locals.url, ...(data.items || []).map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
      sectionFronts: boolObjectToArray(data.excludeSectionFronts),
      secondarySectionFronts: boolObjectToArray(data.excludeSecondarySectionFronts),
      subscriptions: { value: {
        subscriptions: data.excludeSubscriptions ? ['content subscription'] : [],
        stationSlug: getStationSlug(locals)
      } },
      tags: (data.excludeTags || []).map(tag => tag.text)
    },
    curated: data.items || []
  }),
  defaultTemplate = (locals, validatedItem, curatedItem = {}) => ({
    ...curatedItem,
    primaryHeadline: curatedItem.overrideTitle || validatedItem.primaryHeadline,
    pageUri: validatedItem.pageUri,
    urlIsValid: validatedItem.urlIsValid,
    canonicalUrl: curatedItem.url || validatedItem.canonicalUrl,
    feedImgUrl: curatedItem.overrideImage || validatedItem.feedImgUrl,
    sectionFront: validatedItem.sectionFront
  }),
  // Maps defined query filters to correct elastic query formatting
  queryFilters = {
    author: {
      filterCondition: 'must',
      createObj: author => ({ match: { 'authors.normalized': author } })
    },
    canonicalUrls: { createObj: canonicalUrl => ({ match: { canonicalUrl } }) },
    contentTypes: {
      filterCondition: 'must',
      unique: true,
      createObj: contentType => ({ match: { contentType } })
    },
    host: {
      filterCondition: 'must',
      createObj: host => ({ match: { 'hosts.normalized': host } })
    },
    sectionFronts: {
      filterCondition: 'must',
      unique: true,
      createObj: sectionFront => ({
        bool: {
          should: [
            { match: { sectionFront: sectionFront } },
            { match: { sectionFront: sectionFront.toLowerCase() } },
            {
              nested: {
                path: 'stationSyndication',
                query: {
                  bool: {
                    should: [
                      { match: { 'stationSyndication.sectionFront': sectionFront } },
                      { match: { 'stationSyndication.sectionFront': sectionFront.toLowerCase() } }
                    ],
                    minimum_should_match: 1
                  }
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      })
    },
    secondarySectionFronts: {
      createObj: secondarySectionFront => ({
        bool: {
          should: [
            { match: { secondarySectionFront: secondarySectionFront } },
            { match: { secondarySectionFront: secondarySectionFront.toLowerCase() } },
            {
              nested: {
                path: 'stationSyndication',
                query: {
                  bool: {
                    should: [
                      { match: { 'stationSyndication.secondarySectionFront': secondarySectionFront } },
                      { match: { 'stationSyndication.secondarySectionFront': secondarySectionFront.toLowerCase() } }
                    ],
                    minimum_should_match: 1
                  }
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      })
    },
    stationSlug: {
      filterCondition: 'must',
      createObj: (stationSlug, includeSyndicated = true) => {

        const qs = {
          bool: {
            should: [
              { match: { stationSlug } }
            ],
            minimum_should_match: 1
          }
        };

        if (includeSyndicated) {
          qs.bool.should.push({
            nested: {
              path: 'stationSyndication',
              query: {
                match: {
                  'stationSyndication.stationSlug': stationSlug
                }
              }
            }
          });
        }

        if (stationSlug === DEFAULT_STATION.site_slug) {
          qs.bool.should.push({
            bool: {
              must_not: {
                exists: {
                  field: 'stationSlug'
                }
              }
            }
          });
        }

        return qs;
      }
    },
    subscriptions: {
      createObj: ({ stationSlug, subscriptions }) => {
        const matchSources = subscriptions.map(source => ({ match_phrase: { 'stationSyndication.source': source } })),
          anySource = { should: matchSources, minimum_should_match: 1 },
          syndicationQuery = [{ match: { 'stationSyndication.stationSlug': stationSlug } }, { bool: anySource }];

        return { nested: { path: 'stationSyndication', query: { bool: { must: syndicationQuery } } } };
      }
    },
    tags: {
      unique: true,
      createObj: tag => ({ match: { 'tags.normalized': tag } })
    },
    videos: {
      filterCondition: 'must',
      unique: true,
      createObj: value => ({
        bool: {
          should: [
            {
              nested: {
                path: 'lead',
                query: {
                  regexp: {
                    'lead._ref': value
                  }
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      })
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
      { condition = conditionOverride || filterCondition, value, includeSyndicated } = _isPlainObject(valueObj)
        ? valueObj
        : { value: valueObj };

    if (Array.isArray(value)) {
      if (unique && value.length) {
        queryService[getQueryType(condition)](query, minimumShouldMatch(value.map(createObj)));
      } else {
        value.forEach(v => addCondition(query, key, v, condition));
      }
    } else {
      if (!createObj || !value) {
        if (key === 'stationSlug') {
          queryService[getQueryType('must')](query, queryFilters.stationSlug.createObj(''));
        }
        return;
      }

      if (typeof includeSyndicated !== 'undefined') {
        queryService[getQueryType(condition)](query, createObj(value, includeSyndicated));
        return;
      }

      if (key === 'subscriptions' && !value.subscriptions.length) {
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
      // This is from a curated & dynamic author page
      author = locals.params.author;
    }

    // Used for load-more queries
    data.author = author;

    return { author };
  },
  /**
   * Pull host from locals
   *
   * @param {object} data
   * @param {object} locals
   *
   * @return {string} host
   */
  getHost = (data, locals) => {
    const host = _get(locals, 'host') || _get(locals, 'params.host');

    // Used for load-more queries
    data.host = host;

    return { host };
  },
  /**
   * Pull stationSlug from local params if dynamic station page
   * or locals station object
   *
   * @param {object} locals
   *
   * @return {string} stationSlug
   */
  getStationSlug = locals => {
    return _get(locals, 'params.stationSlug') || _get(locals, 'station.site_slug');
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
    } else if (_get(locals, 'params.dynamicTag')) {
      // This is from a tag page
      tags = locals.params.dynamicTag;
    }

    // normalize tag array (based on simple list input)
    if (Array.isArray(tags)) {
      tags = tags.map(tag => _get(tag, 'text', tag)).filter(tag => tag);
    }

    if (typeof tags == 'string' && tags.indexOf(',') > -1) {
      tags = tags.split(',');
    }

    // split comma separated tags (for load-more get queries)
    data.tag = tags;

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
  sectionOrTagCondition = (populateFrom, value) => populateFrom === 'section-front-or-tag' ? {
    condition: 'should',
    value
  } : value,
  /**
   * Verify the url exists and is not a component
   *
   * @param {string} url
   *
   * @returns {boolean}
   */
  validUrl = url => url && !isComponent(url),
  // Get both the results and the total number of results for the query
  transformResult = (formattedResult, rawResult) => ({
    content: formattedResult,
    totalHits: _get(rawResult, 'hits.total')
  }),

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
  fetchRecirculation = async ({ filters, excludes, elasticFields, maxItems, shouldAddAmphoraTimings, isRdcContent }, locals) => {
    let results = {
      content: [],
      totalHits: 0
    };

    if (maxItems === 0) {
      return results;
    }

    const query = queryService.newQueryWithCount(index, maxItems, locals),
      searchOpts = {
        shouldDedupeContent: true,
        transformResult
      };

    // add sorting
    queryService.addSort(query, { date: 'desc' });

    Object.entries(filters).forEach(([key, value]) => {
      // Don't search for primary section front if the secondary is selected
      if (key === 'sectionFronts' && !_isEmpty(filters.secondarySectionFronts)) {
        return;
      }
      if (key === 'includeSyndicated') {
        return;
      }
      if (key === 'stationSlug' && !filters.includeSyndicated) {
        value = Object.assign({ value }, { includeSyndicated: filters.includeSyndicated });
      }
      if (key === 'stationSlug' && isRdcContent) {
        value = DEFAULT_STATION.site_slug;
      }
      addCondition(query, key, value);
    });
    Object.entries(excludes).forEach(([key, value]) => addCondition(query, key, value, 'mustNot'));
    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);

    // If there is a should query, there needs to be a minimum_should_match
    if (_has(query, 'body.query.bool.should[0]')) {
      query.body.query.bool.minimum_should_match = 1;
    }

    const start = new Date();

    try {
      results = await queryService.searchByQuery(query, locals, searchOpts);
    } catch (e) {
      queryService.logCatch(e, 'content-search');
      log('error', 'Error querying Elastic', e);
    } finally {
      addAmphoraRenderTime(
        locals,
        {
          label: 'recirculation.js -> searchByQuery',
          ms: new Date() - start
        },
        { shouldAdd: shouldAddAmphoraTimings }
      );
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
    mapDataToFilters = returnData,
    mapResultsToTemplate = defaultTemplate,
    render = returnData,
    save = returnData,
    shouldAddAmphoraTimings = false,
    skipRender = () => false
  } = {}) => unityComponent({
    async render(uri, data, locals) {
      const curatedIds = (data.items || []).map(anItem => anItem.uri),
        requiredSearchFields = ['stationSlug', 'stationSyndication'],
        esFields = [...new Set([...elasticFields, ...requiredSearchFields])];

      locals.loadedIds = locals.loadedIds.concat(curatedIds);

      if (await skipRender(data, locals)) {
        return render(uri, data, locals);
      }

      try {
        const { filters = {}, excludes = {}, pagination = {}, curated, maxItems = DEFAULT_MAX_ITEMS, isRdcContent = false } = _merge(
            defaultMapDataToFilters(uri, data, locals),
            await mapDataToFilters(uri, data, locals)
          ),
          itemsNeeded = maxItems > curated.length ? maxItems - curated.length : 0,
          { content, totalHits } = await fetchRecirculation(
            {
              filters,
              excludes,
              elasticFields: esFields,
              pagination,
              maxItems: itemsNeeded,
              shouldAddAmphoraTimings,
              isRdcContent
            },
            locals);

        data._computed = Object.assign(data._computed || {}, {
          [contentKey]: await Promise.all(
            [...curated, ...content.map(syndicationUrlPremap(getStationSlug(locals), isRdcContent))]
              .slice(0, maxItems)
              .map(async (item) => mapResultsToTemplate(locals, item))),
          initialLoad: !pagination.page,
          moreContent: totalHits > maxItems
        });
      } catch (e) {
        log('error', `There was an error querying items from elastic - ${e.message}`, e);
      }
      return render(uri, data, locals);
    },
    async save(uri, data, locals) {

      if (!(data.items || []).length || !locals) {
        return save(uri, data, locals);
      }

      data.items = await Promise.all(data.items.map(async (item) => {
        item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
        const searchOpts = {
            includeIdInResult: true,
            shouldDedupeContent: false
          },
          result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, elasticFields, searchOpts);

        item.uri = result._id;

        return mapResultsToTemplate(locals, result, item);
      }));

      return save(uri, data, locals);
    }

  });

module.exports = {
  getStationSlug,
  makeSubscriptionsQuery: queryFilters.subscriptions.createObj,
  recirculationData,
  sectionOrTagCondition
};
