'use strict';

const queryService = require('../../services/server/query'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  loadedIdsService = require('../../services/server/loaded-ids'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront',
    'contentType'
  ],
  maxItems = 6;

/**
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async (uri, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }

  await Promise.all(data.items.map(async item => {
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
      canonicalUrl: result.canonicalUrl,
      feedImgUrl: result.feedImgUrl,
      sectionFront: result.sectionFront
    });

    if (item.title) {
      item.plaintextTitle = toPlainText(item.title);
    }
  }));

  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async (ref, data, locals) => {
  const curatedIds = data.items.filter(item => item.uri).map(item => item.uri),
    availableSlots = maxItems - data.items.length;

  await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);

  if (availableSlots <= 0) {
    data.articles = data.items;
    return data;
  }

  if (!locals) {
    return data;
  }

  // this shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const query = queryService.newQueryWithCount(elasticIndex, availableSlots);

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, {date: 'desc'});
  queryService.addShould(query, {
    nested: {
      path: 'lead',
      query: {
        regexp: {
          'lead._ref': `${process.env.CLAY_SITE_HOST}\/_components\/brightcove\/instances.*`
        }
      }
    }
  });

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

  try {
    const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: true });

    data.articles = data.items.concat(results);
  } catch (e) {
    queryService.logCatch(e, ref);
  }

  return data;
};
