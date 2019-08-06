'use strict';
const queryService = require('../../services/server/query'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  contentTypeService = require('../../services/universal/content-type'),
  { isComponent } = require('clayutils'),
  loadedIdsService = require('../../services/server/loaded-ids'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  maxItems = 3;

/**
 * For each section's override items (0 through 3), look up the associated
 * articles and save them in redis.
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async function (uri, data, locals) {
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
        result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, elasticFields, searchOpts);

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

    await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);
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

    let query = queryService.newQueryWithCount(elasticIndex, availableSlots);

    if (contentTypes.length) {
      queryService.addFilter(query, { terms: { contentType: contentTypes } });
    }

    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);
    queryService.addMinimumShould(query, 1);
    queryService.addSort(query, {date: 'desc'});
    queryService.addShould(query, { match: { sectionFront: section }});

    // Filter out the following tags
    if (data.filterTags) {
      for (const tag of data.filterTags.map((tag) => tag.text)) {
        queryService.addMustNot(query, { match: { 'tags.normalized': tag }});
      }
    }

    // Filter out the following secondary article type
    if (data.filterSecondarySectionFronts) {
      Object.entries(data.filterSecondarySectionFronts).forEach((secondarySectionFront) => {
        let [ secondarySectionFrontFilter, filterOut ] = secondarySectionFront;

        if (filterOut) {
          queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter }});
        }
      });
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
