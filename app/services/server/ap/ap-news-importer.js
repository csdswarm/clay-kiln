'use strict';

const __ = {};

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
 * Handles the logic needed to import or update an artice from the AP media api
 * @param {object} apMeta - The data returned from AP Media for a single article (the item property)
 * @param {object} stationMappings - The station mappings that go with this AP Media article
 * @param {object} locals
 * @returns {Promise<void>}
 */
async function importArticle(apMeta) {
  const isApContentPublishable = checkApPublishable(apMeta);

  return { isApContentPublishable };
}

module.exports = {
  _internals: __,
  importArticle
};
