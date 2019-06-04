'use strict';

const _get = require('lodash/get'),
  _map = require('lodash/map'),
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
  defaultImage = 'http://images.radio.com/aiu-media/og_775x515_0.jpg';

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

  return Promise.all(_map.map(data.items, async (item) => {
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

module.exports.render = async (ref, data, locals) => {
  if (abTest()) {
    const lyticsId = _get(locals, 'lytics.uid'),
      userDefinedParams = lyticsId ? {contentsegment: 'recommended_for_you', url: locals.url} : {},
      recommendations = await lyticsApi.recommend(lyticsId, {limit: 6, ...userDefinedParams}),
      articles = recommendations.data.map(upd => ({
        url: `https://${upd.url}`,
        canonicalUrl: `https://${upd.url}`,
        primaryHeadline: upd.title,
        feedImgUrl: upd.primary_image || defaultImage
      }));

    data.items = articles;
    data.lytics = true;
  }

  return data;
};
