'use strict';

const _get = require('lodash/get'),
  _includes = require('lodash/includes'),
  { unityComponent } = require('../../services/universal/amphora'),
  abTest = require('../../services/universal/a-b-test'),
  lyticsApi = require('../../services/universal/lyticsApi'),
  recircCmpt = require('../../services/universal/recirc/recirc-cmpt'),
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
  MAX_ITEMS = 6,
  searchOpts = {
    includeIdInResult: true,
    shouldDedupeContent: false
  };

module.exports = unityComponent({
  save: async (ref, data, locals) => {
    if (!data.items.length || !locals) {
      return data;
    }

    data.items = await Promise.all(data.items.map(async (item) => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

      const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts),
        article = {
          ...item,
          uri: result._id,
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
    }));

    return data;
  },

  render: async (ref, data, locals) => {
    data._computed.articles = [];

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

      // fetch the content uri for deduping purposes
      articles = await Promise.all(articles.map(async anArticle => {
        const result = await recircCmpt.getArticleDataAndValidate(ref, anArticle, locals, [], searchOpts);

        anArticle.uri = result._id;

        return anArticle;
      }));

      articles = articles.filter(anArticle => !_includes(locals.loadedIds, anArticle.uri));

      if (articles.length > 0) {
        // backfill with curated if lytics didn't provide MAX_ITEMS #
        //  of articles
        if (articles.length !== MAX_ITEMS) {
          const urls = articles.map(item => item.canonicalUrl),
            availableItems = data.items.filter(item => !urls.includes(item.canonicalUrl));

          articles = articles.concat(availableItems.splice(0, MAX_ITEMS - articles.length));
        }

        data._computed.articles = articles;
        data.lytics = true;
      }
    } else {
      // when we're either in edit mode or not using the lytics engine, we want
      //   to start with the curated items
      data._computed.articles = [...data.items];
    }

    locals.loadedIds = locals.loadedIds.concat(
      data._computed.articles.map(item => item.uri)
    );

    // and finally backfill via elasticsearch if there are still available slots
    const numArticlesToBackFill = MAX_ITEMS - data._computed.articles.length;

    if (!locals.edit && numArticlesToBackFill > 0) {
      const responseItems = await buildAndRequestElasticSearch(
        numArticlesToBackFill,
        locals
      ).catch(err => {
        queryService.logCatch(err, ref);
        return [];
      });

      data._computed.articles = data._computed.articles.concat(responseItems);
    }

    data._computed.articles = addParamsAndHttps(data._computed.articles);
    return data;
  }
});

async function buildAndRequestElasticSearch(numResults, locals) {
  const elasticQuery = queryService.newQueryWithCount(elasticIndex, numResults, locals);

  let cleanUrl;

  queryService.addSort(elasticQuery, { date: 'desc' });
  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(elasticQuery, { match: { canonicalUrl: cleanUrl } });
  }

  queryService.onlyWithTheseFields(elasticQuery, elasticFields);
  return queryService.searchByQuery(
    elasticQuery,
    locals,
    { shouldDedupeContent: true }
  );
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
