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
 * authors
 * sectionFront - (use sectionFrontManual if sectionFront is using subscribe)
 * secondarySectionFront - (use secondarySectionFrontManual if secondarySectionFront is using subscribe)
 * tags - (use tagsManual if tags is using subscribe)
 * excludeSectionFronts
 * excludeSecondarySectionFronts
 * excludeTags
 */

const
  _get = require('lodash/get'),
  _has = require('lodash/has'),
  _isEmpty = require('lodash/isEmpty'),
  _isPlainObject = require('lodash/isPlainObject'),
  _merge = require('lodash/merge'),
  _pick = require('lodash/pick'),
  { DEFAULT_STATION } = require('../constants'),
  { addAmphoraRenderTime, boolKeys, cleanUrl, coalesce } = require('../utils'),
  { isComponent } = require('clayutils'),
  { syndicationUrlPremap } = require('../syndication-utils'),
  { unityComponent } = require('../amphora'),
  fetchStationFeeds = require('../../server/fetch-station-feeds'),
  logger = require('../log'),
  queryService = require('../../server/query'),
  recircCmpt = require('./recirc-cmpt'),
  transformStationFeed = require('../../universal/transform-station-feed'),

  log = logger.setup({ file: __filename }),
  index = 'published-content',
  DEFAULT_CONTENT_KEY = 'articles',
  DEFAULT_ELASTIC_FIELDS = [
    'canonicalUrl',
    'contentType',
    'feedImgUrl',
    'pageUri',
    'primaryHeadline',
    'sectionFront'
  ],
  DEFAULT_MAX_ITEMS = 10,

  /**
   * Fetches the rss data for a station feed and
   * transforms it to a recirculation-compatible format.
   *
   * @param   {object}   config
   * @param   {object}   config.data
   * @param   {object}   config.locals
   * @param   {number}   config.numberOfArticles
   * @param   {number}   config.page
   * @param   {function} config.mapResultsToTemplate
   * @returns {object}
   */
  fetchAndTransformStationFeed = async ({
    data,
    locals,
    numberOfArticles,
    page,
    mapResultsToTemplate
  }) => {
    const feed = await fetchStationFeeds(data, locals),
      {
        items: nextContent,
        hasMoreItems: moreContent
      } = await transformStationFeed(
        locals,
        feed,
        numberOfArticles,
        page
      );

    return {
      content: await Promise.all(
        nextContent.map(({
          primaryHeadline,
          externalUrl,
          feedImgUrl,
          date
        }) => mapResultsToTemplate(locals, {
          primaryHeadline,
          feedImgUrl,
          canonicalUrl: externalUrl,
          date
        }))
      ),
      moreContent
    };
  },

  returnData = (_, data) => data,
  defaultMapDataToFilters = (ref, data, locals) => {
    const
      author = getAuthor(data, locals),
      host = getHost(data, locals),
      primarySF = coalesce(data, 'sectionFrontManual','sectionFront'),
      secondarySF =  coalesce(data, 'secondarySectionFrontManual', 'secondarySectionFront'),
      tag = getTag(data, locals);

    return {
      pagination: {
        page: 0
      },
      filters: {
        author,
        host,
        contentTypes: boolKeys(data.contentType),
        ..._pick({
          authors: { condition: 'should', value: data.authors },
          sectionFronts: sectionOrTagCondition(data.populateFrom, primarySF),
          secondarySectionFronts: sectionOrTagCondition(data.populateFrom, secondarySF),
          tags: sectionOrTagCondition(data.populateFrom, tag)
        }, populateFilter(data.populateFrom)),
        stationSlug: getStationSlug(locals)
      },
      excludes: {
        canonicalUrls: [locals.url, ...(data.items || []).map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
        sectionFronts: boolKeys(data.excludeSectionFronts),
        secondarySectionFronts: boolKeys(data.excludeSecondarySectionFronts),
        subscriptions: { value: {
          subscriptions: data.excludeSubscriptions ? ['content subscription'] : [],
          stationSlug: getStationSlug(locals)
        } },
        tags: (data.excludeTags || []).map(tag => tag.text)
      },
      curated: data.items || []
    };
  },
  defaultTemplate = (locals, validatedItem, curatedItem = {}) => ({
    ...curatedItem,
    primaryHeadline: curatedItem.overrideTitle || validatedItem.primaryHeadline,
    pageUri: validatedItem.pageUri,
    canonicalUrl: curatedItem.url || validatedItem.canonicalUrl,
    feedImgUrl: curatedItem.overrideImage || validatedItem.feedImgUrl,
    sectionFront: validatedItem.sectionFront
  }),
  /**
   * Handles inserting stationSlug into a values list for multiple section fronts
   * @param {string} key
   * @param {function} createObj
   * @param {boolean} [includeSyndicated]
   * @param {string} [stationSlug]
   * @returns {function(*=): (*)}
   */
  listFilter = ({ key, createObj, includeSyndicated, stationSlug }) => value => {
    if (['sectionFronts', 'secondarySectionFronts'].includes(key)) {
      return createObj(
        value,
        stationSlug,
        includeSyndicated
      );
    } else {
      return createObj(value);
    }
  },
  // Maps defined query filters to correct elastic query formatting
  queryFilters = {
    author: {
      filterCondition: 'must',
      createObj: author => ({ match: { 'authors.normalized': author } })
    },
    authors: {
      filterCondition: 'must',
      createObj: authors => boolKeys(authors).map(author => ({ match: { 'authors.normalized': author } }))
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
      createObj: (sectionFront, stationSlug, includeSyndicated = true) => minimumShouldMatch([
        {
          bool: {
            must: [
              filterMainStation(stationSlug),
              ...multiCaseFilter({ sectionFront })
            ]
          }
        },
        includeSyndicated && syndicatedSectionFrontFilter(
          stationSlug,
          { 'stationSyndication.sectionFront': sectionFront }
        )
      ].filter(Boolean))
    },
    secondarySectionFronts: {
      filterCondition: 'must',
      unique: true,
      createObj: ({ sectionFront, secondarySectionFront }, stationSlug, includeSyndicated = true) => minimumShouldMatch([
        {
          bool: {
            must: [
              filterMainStation(stationSlug),
              ...multiCaseFilter({ sectionFront, ...secondarySectionFront && { secondarySectionFront } })
            ].filter(Boolean)
          }
        },
        includeSyndicated && syndicatedSectionFrontFilter(
          stationSlug,
          { 'stationSyndication.sectionFront': sectionFront },
          secondarySectionFront && { 'stationSyndication.secondarySectionFront': secondarySectionFront }
        )
      ].filter(Boolean))
    },
    stationSlug: {
      filterCondition: 'must',
      createObj: (stationSlug, includeSyndicated = true) => {
        const syndicated = includeSyndicated ? [syndicatedStationFilter(stationSlug)] : [];

        return minimumShouldMatch([
          filterMainStation(stationSlug),
          ...syndicated
        ]);
      }
    },
    subscriptions: {
      createObj: ({ stationSlug, subscriptions }) => {
        const matchSources = source => ({ match_phrase: { 'stationSyndication.source': source } }),
          anySource = minimumShouldMatch(subscriptions.map(matchSources)),
          syndicationQuery = [{ match: { 'stationSyndication.stationSlug': stationSlug } }, anySource];

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
      createObj: value => minimumShouldMatch([
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
      ])
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
   * Creates a filter for the main station of an article or gallery
   * @param { string } stationSlug
   * @returns {{bool: {should: Array, minimum_should_match: number}}}
   */
  filterMainStation = stationSlug => minimumShouldMatch([
    { match: { stationSlug } },
    stationSlug === DEFAULT_STATION.site_slug && {
      bool: {
        must_not: {
          exists: {
            field: 'stationSlug'
          }
        }
      }
    }
  ].filter(Boolean)),


  /**
   * Convert array to a bool query with a minimum should match
   *
   * @param {array} queries
   * @param {number} minimum_should_match
   * @returns {object}
   */
  minimumShouldMatch = (queries, minimum_should_match = 1) => ({
    bool: { should: queries, minimum_should_match }
  }),

  /**
   * Creates a filter for when we need to check regular and lower case versions of the property
   * value.
   * @param {object} obj - essentially the property and value to check. the value will be checked
   *                       as is and lowercase against the data
   * @returns {{bool: {should: Array, minimum_should_match: number}}}
   */
  multiCaseFilter = obj => Object.entries(obj).map(([key, value]) => minimumShouldMatch([
    { match: { [ key ]: `${value}` } },
    { match: { [ key ]: `${value}`.toLowerCase() } }
  ])),

  /**
   * Creates a filter for a syndicated sectionFront or secondarySectionFront
   * @param {string} stationSlug - The station to filter by
   * @param {object} sectionFront - The section front property and value to filter
   * @param {object} secondarySectionFront - The secondary section front property and value to filter
   * @returns {*|
   *   {nested: {path: string, query: {bool: {must: [{match: {'stationSyndication.stationSlug': *}},
   *   {bool: {should: Array, minimum_should_match: number}}]}}}}
   * }
   */
  syndicatedSectionFrontFilter = (stationSlug, sectionFront, secondarySectionFront) => ({
    nested: {
      path: 'stationSyndication',
      query: {
        bool: {
          must: [
            {
              match: {
                'stationSyndication.stationSlug': stationSlug
              }
            },
            ...multiCaseFilter({ ...sectionFront, ...secondarySectionFront })
          ].filter(Boolean)
        }
      }
    }
  }),

  /**
   * Adds an extra condition for only subscribed content
   * @returns {(*|{bool: { should: [{ match: {'stationSyndication.unsubscribed': false}}]}})[]}
   */
  subscribedContentOnly = [{
    bool: {
      should: [
        {
          match: {
            'stationSyndication.unsubscribed': false
          }
        },
        {
          bool: {
            must_not: {
              exists: {
                field: 'stationSyndication.unsubscribed'
              }
            }
          }
        }
      ],
      minimum_should_match: 1
    }
  }],

  /**
   * Creates a filter for the syndicated station or an empty array if includeSyndicated is false
   * @param {string} stationSlug - The station to filter by
   * @returns {(*|{nested: {path: string, query: {match: {'stationSyndication.stationSlug': *}}}})[]}
   */
  syndicatedStationFilter = (stationSlug) => ({
    nested: {
      path: 'stationSyndication',
      query: {
        bool: {
          must: [
            {
              match: {
                'stationSyndication.stationSlug': stationSlug
              }
            },
            ...subscribedContentOnly
          ]
        }
      }
    }
  }),

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
      {
        condition = conditionOverride || filterCondition,
        includeSyndicated,
        stationSlug,
        value
      } = _isPlainObject(valueObj) ? valueObj : { value: valueObj };

    if (Array.isArray(value)) {
      if (unique && value.length) {
        const items = value.map(listFilter({
          createObj,
          includeSyndicated,
          key,
          stationSlug
        }));

        queryService[getQueryType(condition)](query, minimumShouldMatch(items));
      } else {
        value.forEach(v => addCondition(query, key, v, condition));
      }
    } else {
      if (!createObj || !value) {
        if (key === 'stationSlug') {
          queryService[getQueryType('must')](
            query,
            queryFilters.stationSlug.createObj(DEFAULT_STATION.site_slug)
          );
        }
        return;
      }

      if (stationSlug !== undefined) {
        queryService[getQueryType(condition)](query, createObj(value, stationSlug, includeSyndicated));
        return;
      }

      if (key === 'subscriptions' && !value.subscriptions.length) {
        return;
      }
      queryService[getQueryType(condition)](query, createObj(value, includeSyndicated));
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
    data.author = coalesce(locals, 'author', 'params.author');

    return data.author;
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
    data.host = coalesce(locals, 'host', 'params.host');

    return data.host;
  },
  /**
   * Pull stationSlug from local params if dynamic station page
   * or locals station object
   *
   * @param {object} locals
   *
   * @return {string} stationSlug
   */
  getStationSlug = locals => coalesce(locals, 'params.stationSlug', 'station.site_slug'),

  /**
   * Pull tags from locals or data whether a static or dynamic tag page
   *
   * @param {object} data
   * @param {object} locals
   *
   * @return {array} tags
   */
  getTag = (data, locals) => {
    let tags = coalesce({ data, locals }, 'locals.tag', 'locals.params.dynamicTag', 'data.tagManual', 'data.tag');

    // normalize tag array (based on simple list input)
    if (Array.isArray(tags)) {
      tags = tags.map(tag => _get(tag, 'text', tag)).filter(tag => tag);
    }

    if (tags === '') {
      return [];
    }

    // split comma separated tags (for load-more get queries)
    if (typeof tags === 'string' && tags.includes(',')) {
      tags = tags.split(',');
    }

    // Check for tags in the case of one column layouts, and retain the correct formatting for updating the tags for kiln's UI
    if (typeof tags === 'string') {
      data.tag = [{ text: tags }];
    } else if (Array.isArray(tags)) {
      data.tag = tags.map((t) => typeof t === 'string' ? { text: t } : t);
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
      case 'byline':
        return ['authors'];
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
   * assigns urlIsValid to item if the key exists on result
   *
   * @param {object} result
   * @param {object} item - this is mutated
   */
  handleUrlIsValid = (result, item) => {
    if (result.hasOwnProperty('urlIsValid')) {
      item.urlIsValid = result.urlIsValid;
    }
  },

  /**
   * Use filters to query elastic for content
   * @param {{
   *   filters: object,
   *   excludes: object,
   *   elasticFields: string[],
   *   maxItems: number,
   *   shouldAddAmphoraTimings: boolean,
   *   isRdcContent: boolean
   * }} config
   * @param {Object} [locals]
   * @returns {array} elasticResults
   */
  fetchRecirculation = async (config, locals) => {
    const { filters, excludes, elasticFields, maxItems, shouldAddAmphoraTimings, isRdcContent } = config;
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

    const { includeSyndicated, stationSlug = DEFAULT_STATION.site_slug } = filters;

    Object.entries(filters).forEach(([key, value]) => {

      switch (key) {
        case 'sectionFronts':
          if (!_isEmpty(filters.secondarySectionFronts)) {
            return;
          }
          value = { value, stationSlug, includeSyndicated };
          break;
        case 'secondarySectionFronts':
          if (_isEmpty(value)) {
            return;
          }
          value = {
            value: {
              sectionFront: filters.sectionFronts,
              secondarySectionFront: value
            },
            stationSlug,
            includeSyndicated
          };
          break;
        case 'includeSyndicated':
          return;
        case 'stationSlug':
          const hasSectionFrontFilter = !(_isEmpty(filters.sectionFronts) && _isEmpty(filters.secondarySectionFronts));

          if (hasSectionFrontFilter) {
            return;
          }
          if (isRdcContent) {
            value = DEFAULT_STATION.site_slug;
          }
          value = { value, includeSyndicated };
          break;
        default:
          // do nothing
      }
      addCondition(query, key, value);
    });

    Object.entries(excludes)
      .forEach(([key, value]) => {
        if (['sectionFronts', 'secondarySectionFronts'].includes(key)) {
          value = { value, stationSlug };
        }
        addCondition(query, key, value, 'mustNot');
      });
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
   * @param {function} [config.mapDataToFilters]
   * @param {function} [config.mapResultsToTemplate]
   * @param {function} [config.render]
   * @param {function} [config.save]
   * @param {boolean} [config.shouldAddAmphoraTimings]
   * @param {boolean} [config.skipRender]
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

      const {
          filters = {}, excludes = {}, pagination = {}, curated,
          maxItems = DEFAULT_MAX_ITEMS, isRdcContent = false
        } = _merge(
          defaultMapDataToFilters(uri, data, locals),
          await mapDataToFilters(uri, data, locals)
        ),
        itemsNeeded = maxItems > curated.length ? maxItems - curated.length : 0;

      try {
        const isFromRss = data.populateFrom === 'rss-feed';

        if (isFromRss) {
          const { content, moreContent } = await fetchAndTransformStationFeed({
            data, locals,
            numberOfArticles: itemsNeeded,
            page: pagination.page,
            mapResultsToTemplate
          });

          data._computed = Object.assign(data._computed || {}, {
            [contentKey]: [...curated, ...content],
            initialLoad: !pagination.page,
            moreContent
          });

        } else {

          const { content, totalHits } = await fetchRecirculation({
            filters,
            excludes,
            elasticFields: esFields,
            pagination,
            maxItems: itemsNeeded,
            shouldAddAmphoraTimings,
            isRdcContent
          }, locals);

          data._computed = Object.assign(data._computed || {}, {
            [contentKey]: await Promise.all(
              [...curated, ...content.map(syndicationUrlPremap(getStationSlug(locals), isRdcContent))]
                .slice(0, maxItems)
                .map(async (result) => {
                  const item = {};

                  handleUrlIsValid(result, item);

                  return mapResultsToTemplate(locals, result, item);
                })
            ),
            initialLoad: !pagination.page,
            moreContent: totalHits > maxItems
          });
        }
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

        handleUrlIsValid(result, item);

        return mapResultsToTemplate(locals, result, item);
      }));

      return save(uri, data, locals);
    }

  });

module.exports = {
  getStationSlug,
  makeSubscriptionsQuery: queryFilters.subscriptions.createObj,
  recirculationData,
  sectionOrTagCondition,
  subscribedContentOnly
};
