'use strict';

const recircCmpt = require('../../universal/recirc/recirc-cmpt'),
  searchOpts = {
    includeIdInResult: true,
    shouldDedupeContent: false
  };

/**
 * Mutates each item by assigning the 'uri' fetched from elasticsearch
 *
 * @param {string} uri
 * @param {object[]} items
 * @param {object} locals
 * @returns {Promise}
 */
module.exports = (uri, items, locals) => {
  return Promise.all(items.map(async item => {
    const result = await recircCmpt.getArticleDataAndValidate(uri, item, locals, [], searchOpts);

    if (result._id) {
      item.uri = result._id;
    }
  }));
};
