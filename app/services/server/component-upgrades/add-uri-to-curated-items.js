'use strict';

const recircCmpt = require('../../universal/recirc-cmpt'),
  searchOpts = {
    includeIdInResult: true,
    shouldDedupeContent: false
  };

/**
 * Mutates data by assigning 'uri' to each curated item
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
