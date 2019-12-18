'use strict';

const _get = require('lodash/get'),
  { unityComponent } = require('../../services/universal/amphora'),
  abTest = require('../../services/universal/a-b-test'),
  lyticsApi = require('../../services/universal/lyticsApi'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  queryService = require('../../services/server/query'),
  { isComponent } = require('clayutils'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  elasticIndex = 'published-content',
  defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
  MAX_LYTICS = 10, // since lytics has bad data, get more than the required amount
  MAX_ITEMS = 6;

module.exports = unityComponent({
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render: async (ref, data, locals) => {
    if (abTest() && !locals.edit) {
      const lyticsId = _get(locals, 'lytics.uid'),
        noUserParams = lyticsId ? {} : { url: locals.url },
        recommendations = await lyticsApi.recommend(lyticsId, { limit: MAX_LYTICS, contentsegment: 'recommended_for_you', ...noUserParams }),
        recommendedUrls = recommendations.map(upd => upd.url);
      let articles =
        // remove duplicates by checking the position of the urls and remove items that have no title
        recommendations.filter((item, index) => recommendedUrls.indexOf(item.url) === index && item.title)
          .map(
            upd => ({
              url: `https://${upd.url}`,
              canonicalUrl: `https://${upd.url}`,
              primaryHeadline: upd.title,
              feedImgUrl: upd.primary_image || defaultImage,
              lytics: true,
              params: '?article=recommended'
            })
          ).splice(0, MAX_ITEMS);

      if (articles.length > 0) {
        // backfill if there are missing items
        if (articles.length !== MAX_ITEMS) {
          const urls = articles.map(item => item.canonicalUrl),
            availableItems = data.items.filter(item => !urls.includes(item.canonicalUrl));

          articles = articles.concat(availableItems.splice(0, MAX_ITEMS - articles.length));
        }

        data.items = articles;
        data.lytics = true;
      }
    }

    // leaving the lytics stuff above intact and seeing if we need to backfill
    const numArticlesToBackFill = MAX_ITEMS - data.items.length;

    if (!locals.edit && numArticlesToBackFill > 0) {
      await buildAndRequestElasticSearch(numArticlesToBackFill, data.items, locals)
        .then(responseItems => {
          data._computed.articles = [...data.items, ...responseItems];
        })
        .catch(err => {
          queryService.logCatch(err, ref);
          // still send the curated items
          data._computed.articles = [...data.items];
        });
    } else {
      // no need to backfill
      data._computed.articles = [...data.items];
    }

    data._computed.articles = addParamsAndHttps(data._computed.articles);
    return data;

  },
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  save: (ref, data, locals) => {
    if (!data.items.length || !locals) {
      return data;
    }

    return Promise.all(data.items.map(async (item) => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

      const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields),
        article = {
          ...item,
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: result.canonicalUrl,
          feedImgUrl: result.feedImgUrl,
          sectionFront: result.sectionFront
        };

      if (article.title) {
        article.plaintextTitle = toPlainText(article.title);
      }

      return article;
    }))
      .then((items) => {
        data.items = items;

        return data;
      });
  }
});


async function buildAndRequestElasticSearch(numResults, curatedItems, locals) {
  const elasticQuery = queryService.newQueryWithCount(elasticIndex, numResults);

  let cleanUrl;

  queryService.addSort(elasticQuery, { date: 'desc' });
  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(elasticQuery, { match: { canonicalUrl: cleanUrl } });
  }

  // exclude the curated content from the results
  if (curatedItems.length > 0) {
    curatedItems.forEach(item => {
      if (item.canonicalUrl) {
        cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(elasticQuery, { match: { canonicalUrl: cleanUrl } });
      }
    });
  }

  queryService.onlyWithTheseFields(elasticQuery, elasticFields);
  return await queryService.searchByQuery(elasticQuery);
}

function addParamsAndHttps(arr) {
  return arr
    .filter(item => item.feedImgUrl)
    .map(item => {
      const newItem = { ...item };

      newItem.params = newItem.params || '?article=curated';
      newItem.feedImgUrl = newItem.feedImgUrl.replace('http://', 'https://');
      newItem.feedImgUrl += newItem.feedImgUrl.includes('?') ? '&' : '?';
      return newItem;
    });
}
