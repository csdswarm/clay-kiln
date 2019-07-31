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
  defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';

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

    const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields),
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
  if (abTest()) {
    const lyticsId = _get(locals, 'lytics.uid'),
      noUserParams = lyticsId ? {} : {url: locals.url},
      recommendations = await lyticsApi.recommend(lyticsId, {limit: 6, contentsegment: 'recommended_for_you', ...noUserParams}),
      articles = recommendations.map(upd => ({
        url: `https://${upd.url}`,
        canonicalUrl: `https://${upd.url}`,
        primaryHeadline: upd.title,
        feedImgUrl: upd.primary_image || defaultImage
      }));

    if (articles.length > 0) {
      data.items = articles;
      data.lytics = true;
    }
  }

  (data.items || []).map(item => {
    item.params = `?article=${data.lytics ? 'recommended' : 'curated'}`;
    item.feedImgUrl += item.feedImgUrl.replace('http://', 'https://').includes('?') ? '&' : '?';
  });

  return data;
};
