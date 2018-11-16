'use strict';
const queryService = require('../../services/server/query'),
  db = require('../../services/server/db'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
  elasticIndex = 'published-articles',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl'
  ],
  maxItems = 5;
/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */

module.exports.save = (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }
  return Promise.all(_.map(data.items, (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    return recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields)
      .then((result) => {
        const article = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: item.overrideImage || result.feedImgUrl
        });

        return article;
      });
  }))
    .then((items) => {
      data.items = items;
      return data;
    });
};
/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  const query = queryService.newQueryWithCount(elasticIndex, maxItems, locals),
    trendingRecircRef = `${locals.site.host}/_components/trending-recirculation/instances/default@published`;
  let cleanUrl, trendingRecircItems;

  return (async () => {

    // Get array of trending recirculation items from db, default to empty array.
    try {
      const trendingRecircData = await db.get(trendingRecircRef);

      trendingRecircItems = trendingRecircData.items;
    } catch (e) {
      if (e.message === `Key not found in database [${trendingRecircRef}]`) {
        trendingRecircItems = [];
      } else {
        throw e;
      }
    }

    queryService.withinThisSiteAndCrossposts(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);
    if (data.populateBy == 'tag') {
      if (!data.tag || !locals) {
        return data;
      }
      // Clean based on tags and grab first as we only ever pass 1
      data.tag = tag.clean([{text: data.tag}])[0].text || '';
      queryService.addShould(query, { match: { 'tags.normalized': data.tag }});
    } else if (data.populateBy == 'articleType') {
      if (!data.articleType || !locals) {
        return data;
      }
      queryService.addShould(query, { match: { articleType: data.articleType }});
    }
    queryService.addMinimumShould(query, 1);
    queryService.addSort(query, {date: 'desc'});

    // exclude the current page in results
    if (locals.url && !isComponent(locals.url)) {
      cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
      queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
    }

    // exclude the curated content from the results
    if (data.items && !isComponent(locals.url)) {
      data.items.forEach(item => {
        cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      });
    }

    // exclude trending recirculation content from the results.
    if (trendingRecircItems.length && !isComponent(locals.url)) {
      trendingRecircItems.forEach(item => {
        cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      });
    }

    // hydrate item list.
    const hydrationResults = await queryService.searchByQuery(query);

    data.articles = data.items.concat(_.take(hydrationResults, maxItems)).slice(0, maxItems); // show a maximum of maxItems links

    return data;

  })()
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
