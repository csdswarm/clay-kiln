'use strict';
const
  _set = require('lodash/set'),
  { searchByQuery } = require('../query'),

  QUERY_TEMPLATE = {
    index: 'published-content',
    type: '_doc',
    body: {
      query: { term: { 'ap.itemid': '' } },
      size: 1,
      _source: false
    }
  },

  __ = {
    searchByQuery
  };

/**
 * Checks to see if the AP Content is publishable
 * @param {string[]} editorialtypes
 * @param {string[]} signals
 * @param {string} pubstatus
 * @returns {boolean}
 */
function checkApPublishable({ editorialtypes, pubstatus, signals }) {
  return signals.includes('newscontent') && pubstatus === 'usable' && !editorialtypes.includes('Kill');
}

/**
 * Checks elastic to see if there is an existing article with a matching itemid. If so, this article has been
 * imported before.
 * @param {string} itemid
 * @returns {object|undefined}
 */
async function findExistingArticle({ itemid }) {
  const query = _set({ ...QUERY_TEMPLATE }, 'body.query.term[\'ap.itemid\']', itemid),
    [existing] = await __.searchByQuery(query, null, { includeIdInResult: true });
  
  return existing;
}


/**
 * Handles the logic needed to import or update an artice from the AP media api
 * @param {object} apMeta - The data returned from AP Media for a single article (the item property)
 * @param {object} stationMappings - The station mappings that go with this AP Media article
 * @param {object} locals
 * @returns {Promise<void>}
 */
async function importArticle(apMeta) {
  const isApContentPublishable = checkApPublishable(apMeta),
    existingArticle = await findExistingArticle(apMeta.altids);

  return {
    existingArticle,
    isApContentPublishable
  };
}

module.exports = {
  _internals: __,
  importArticle
};
