'use strict';
const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  contentTypeService = require('../../services/server/content-type'),
  { isComponent } = require('clayutils'),
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
    data[`${section}Items`] = await Promise.all(items.map(async (item) => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
      const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields),
        article = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: item.overrideImage || result.feedImgUrl
        });

      return article;
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
  data.articles = [];

  const contentTypes = contentTypeService.parseFromData(data)

  for (const section of data.sectionFronts) {
    const items = data[`${section}Items`],
      cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    let query = queryService.newQueryWithCount(elasticIndex, maxItems);

    if (contentTypes.length) {
      queryService.addFilter(query, { terms: { contentType: contentTypes } });
    }

    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);
    queryService.addMinimumShould(query, 1);
    queryService.addSort(query, {date: 'desc'});
    queryService.addShould(query, { match: { sectionFront: section }});

    // exclude the current page in results
    if (locals.url && !isComponent(locals.url)) {
      queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
    }

    // exclude the curated content from the results
    if (items && !isComponent(locals.url)) {
      items.forEach(() => {
        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      });
    }

    try {
      const results = await queryService.searchByQuery(query),
        // combine the curated articles (musicItems, newsItems, sportsItems, etc.) with the query results
        articles = items.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links

      data.articles.push({ section, articles });
    } catch (e) {
      queryService.logCatch(e, ref);
    }
  }
  return data;
};
