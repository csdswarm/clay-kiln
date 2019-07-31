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
      recommendations = await lyticsApi.recommend(lyticsId, {limit: 6, contentsegment: 'recommended_for_you', ...noUserParams});
    let articles = [
      // create a set to remove duplicates then deconstruct back to an array
      ...new Set(
        recommendations.map(
          upd => ({
            url: `https://${upd.url}`,
            canonicalUrl: `https://${upd.url}`,
            primaryHeadline: upd.title,
            feedImgUrl: upd.primary_image || defaultImage,
            lytics: true
          })
        )
      )
    ];

    if (articles.length > 0) {
      // backfill if there are missing items
      if (articles.length !== 6) {
        const urls = articles.map(item => item.canonicalUrl),
          availableItems = data.items.filter(item => !urls.includes(item.canonicalUrl));

        articles = articles.concat(availableItems.splice(0, 6 - articles.length));
      }

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
