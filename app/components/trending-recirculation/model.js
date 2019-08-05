'use strict';

const _get = require('lodash/get'),
  abTest = require('../../services/universal/a-b-test'),
  lyticsApi = require('../../services/universal/lyticsApi'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
  MAX_LYTICS = 10, // since lytics has bad data, get more than the required amount
  MAX_ITEMS = 6;

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

  return Promise.all(data.items.map(async (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

    const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, { shouldDedupeContent: false }),
      article = {
        ...item,
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
module.exports.render = async (ref, data, locals) => {
  if (abTest() && !locals.edit) {
    const lyticsId = _get(locals, 'lytics.uid'),
      noUserParams = lyticsId ? {} : {url: locals.url},
      recommendations = await lyticsApi.recommend(lyticsId, {limit: MAX_LYTICS, contentsegment: 'recommended_for_you', ...noUserParams}),
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

  (data.items || []).map(item => {
    item.params = item.params || '?article=curated';
    item.feedImgUrl += item.feedImgUrl.replace('http://', 'https://').includes('?') ? '&' : '?';
  });

  return data;
};
