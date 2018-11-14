'use strict';

const _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'articleType'
  ];

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

  return Promise.all(_.map(data.items, async (item) => {
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
