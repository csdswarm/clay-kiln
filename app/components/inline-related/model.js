'use strict';

const queryService = require('../../services/server/query'),
  _get = require('lodash/get'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  loadedIdsService = require('../../services/server/loaded-ids'),
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'lead',
    'contentType'
  ],
  maxItems = 2;


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
      result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, elasticFields, searchOpts),
      leadRef = _get(result, 'lead[0]._ref');

    Object.assign(item, {
      uri: result._id,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: result.canonicalUrl,
      feedImgUrl: result.feedImgUrl,
      lead: leadRef
        ? leadRef.split('/')[2]
        : null
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
module.exports.render = async function (ref, data, locals) {
  const curatedIds = data.items.filter(i => i.uri).map(i => i.uri),
    availableSlots = maxItems - data.items.length;

  await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);

  // it shouldn't be less than 0, but just in case
  if (availableSlots <= 0) {
    return data;
  }

  // this shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const numItemsToQuery = Math.min(availableSlots, data.fill),
    query = queryService.newQueryWithCount(elasticIndex, numItemsToQuery, locals);
  let cleanUrl;

  // items are saved from form, articles are used on FE
  data.articles = data.items;
  data.missingItems = data.articles.some(item => {
    return typeof item.feedImgUrl === 'undefined';
  });

  if (!data.tag || !locals) {
    return data;
  }

  // Clean based on tags and grab first as we only ever pass 1
  data.tag = tag.clean([{text: data.tag}])[0].text || '';

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addShould(query, { match: { 'tags.normalized': data.tag }});
  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, {date: 'desc'});

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  try {
    const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: true });

    data.articles = data.items.concat(results);
  } catch (e) {
    queryService.logCatch(e, ref);
  }

  return data;
};
