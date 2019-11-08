'use strict';

const _get = require('lodash/get'),
  _includes = require('lodash/includes'),
  abTest = require('../../services/universal/a-b-test'),
  lyticsApi = require('../../services/universal/lyticsApi'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  loadedIdsService = require('../../services/server/loaded-ids'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
  MAX_LYTICS = 10, // since lytics has bad data, get more than the required amount
  MAX_ITEMS = 6,
  searchOpts = {
    includeIdInResult: true,
    shouldDedupeContent: false
  };

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
        feedImgUrl: result.feedImgUrl
      };

    if (article.title) {
      article.plaintextTitle = toPlainText(article.title);
    }

    return article;
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
  if (abTest() && !locals.edit) {
    const lyticsId = _get(locals, 'lytics.uid'),
      noUserParams = lyticsId ? {} : { url: locals.url },
      recommendations = await lyticsApi.recommend(lyticsId, { limit: MAX_LYTICS, contentsegment: 'recommended_for_you', ...noUserParams }),
      recommendedUrls = recommendations.map(upd => upd.url),
      currentlyLoadedIds = await loadedIdsService.lazilyGetFromLocals(locals);
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

    articles = articles.filter(anArticle => !_includes(currentlyLoadedIds, anArticle.uri));

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

  (data.items || []).map(item => {
    item.params = item.params || '?article=curated';
    item.feedImgUrl += item.feedImgUrl.replace('http://', 'https://').includes('?') ? '&' : '?';
  });

  const newLoadedIds = data.items.filter(item => item.uri).map(item => item.uri);

  await loadedIdsService.appendToLocalsAndRedis(newLoadedIds, locals);

  return data;
};
