'use strict';
const
  contentTypeService = require('../../services/universal/content-type'),
  queryService = require('../../services/server/query'),
  recircCmpt = require('../../services/universal/recirc/recirc-cmpt'),
  { getStationSlug, makeSubscriptionsQuery } = require('../../services/universal/recirc/recirculation'),
  { DEFAULT_STATION } = require('../../services/universal/constants'),
  { isComponent } = require('clayutils'),

  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  elasticIndex = 'published-content',
  maxItems = 3;

/**
 * For each section's override items (0 through 3), look up the associated
 * articles and save them in redis.
 *
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async function (ref, data, locals) {
  for (const section of data.sectionFronts) {
    const items = data[`${section}Items`];

    if (!items.length || !locals) {
      continue;
    }

    // for each item, look up the associated article and save that.
    await Promise.all(items.map(async (item) => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

      const searchOpts = {
          includeIdInResult: true,
          shouldDedupeContent: false
        },
        result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts);

      Object.assign(item, {
        uri: result._id,
        primaryHeadline: item.overrideTitle || result.primaryHeadline,
        pageUri: result.pageUri,
        urlIsValid: result.urlIsValid,
        canonicalUrl: item.url || result.canonicalUrl,
        feedImgUrl: item.overrideImage || result.feedImgUrl
      });
    }));
  }

  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  for (const section of data.sectionFronts) {
    const items = data[`${section}Items`],
      curatedIds = items.filter(item => item.uri).map(item => item.uri);

    locals.loadedIds = locals.loadedIds.concat(curatedIds);
  }

  data.articles = [];

  const contentTypes = contentTypeService.parseFromData(data);

  for (const section of data.sectionFronts) {
    const items = data[`${section}Items`],
      cleanUrl = locals.url.split('?')[0].replace('https://', 'http://'),
      availableSlots = maxItems - items.length;

    if (!availableSlots) {
      data.articles.push({ section, articles: items });
      continue;
    }

    const query = queryService.newQueryWithCount(elasticIndex, availableSlots, locals),
      station_slug = locals.station.site_slug || '';

    if (contentTypes.length) {
      queryService.addFilter(query, { terms: { contentType: contentTypes } });
    }

    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);
    queryService.addMinimumShould(query, 1);
    queryService.addSort(query, { date: 'desc' });
    queryService.addShould(query, { match: { sectionFront: section } });
    

    if (station_slug === DEFAULT_STATION.site_slug) {
      queryService.addMustNot(query, { exists: { field: 'stationSlug' } });
    } else {
      queryService.addMust(query, { match: { stationSlug: station_slug } });
    }

    // Filter out the following tags
    if (data.filterTags) {
      for (const tag of data.filterTags.map((tag) => tag.text)) {
        queryService.addMustNot(query, { match: { 'tags.normalized': tag } });
      }
    }

    // Filter out the following secondary article type
    if (data.filterSecondarySectionFronts) {
      Object.entries(data.filterSecondarySectionFronts).forEach((secondarySectionFront) => {
        const [secondarySectionFrontFilter, filterOut] = secondarySectionFront;

        if (filterOut) {
          queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter } });
        }
      });
    }

    if (data.excludeSubscriptions) {
      const stationSlug = getStationSlug(locals);

      queryService.addMustNot(query, makeSubscriptionsQuery({
        stationSlug,
        subscriptions: ['national subscription']
      }));
    }

    // exclude the current page in results
    if (locals.url && !isComponent(locals.url)) {
      queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
    }

    try {
      const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: true }),
        // combine the curated articles (musicItems, newsItems, sportsItems, etc.) with the query results
        articles = items.concat(results);

      data.articles.push({ section, articles });
    } catch (e) {
      queryService.logCatch(e, ref);
    }
  }

  return data;
};
