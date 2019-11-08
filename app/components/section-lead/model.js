'use strict';

const queryService = require('../../services/server/query'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  loadedIdsService = require('../../services/server/loaded-ids'),
  contentTypeService = require('../../services/universal/content-type'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  maxItems = 3,
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`;

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }

  data.primaryStoryLabel = data.primaryStoryLabel
    || locals.sectionFront
    || locals.secondarySectionFront
    || data.tag;

  await Promise.all(data.items.map(async item => {
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
    setPrimaryStoryLabel = () => {
      data.primaryStoryLabel = data.primaryStoryLabel
        || locals.secondarySectionFront
        || locals.sectionFront
        || data.tag;
    },
    availableSlots = maxItems - data.items.length;

  await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);

  // items are saved from form, articles are used on FE, and make sure they use the correct protocol
  data.items = data.articles = data.items
    .filter(item => item.canonicalUrl)
    .map(item => ({
      ...item,
      canonicalUrl: item.canonicalUrl.replace(/^http:/, protocol)
    }));

  if (!locals || !locals.sectionFront && !locals.secondarySectionFront) {
    return data;
  }

  if (availableSlots <= 0) {
    setPrimaryStoryLabel();
    return data;
  }

  // these shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const query = queryService.newQueryWithCount(elasticIndex, availableSlots, locals),
    contentTypes = contentTypeService.parseFromData(data);
  let cleanUrl;

  if (contentTypes.length) {
    queryService.addFilter(query, { terms: { contentType: contentTypes } });
  }

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (locals.secondarySectionFront) {
    queryService.addMust(query, { match: { secondarySectionFront: locals.secondarySectionFront } });
  } else if (locals.sectionFront) {
    queryService.addMust(query, { match: { sectionFront: locals.sectionFront } });
  } else if (data.tag) {
    queryService.addMust(query, { match: { 'tags.normalized': data.tag } });
  }
  queryService.addSort(query, { date: 'desc' });

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
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
      const [ secondarySectionFrontFilter, filterOut ] = secondarySectionFront;

      if (filterOut) {
        queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter } });
      }
    });
  }

  try {
    const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: true });

    data.articles = data.items.concat(results);
    setPrimaryStoryLabel();
  } catch (e) {
    queryService.logCatch(e, ref);
  }

  return data;
};
