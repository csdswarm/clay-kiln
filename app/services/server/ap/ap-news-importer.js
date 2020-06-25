'use strict';

const __ = {

};

/**
 * Checks to see if the AP Content is publishable
 * @param {string[]} signals
 * @returns {*}
 */
function checkApPublishable({ signals }) {
  return signals.includes('newscontent');
}

/**
 * Handles the logic needed to import or update an artice from the AP media api
 * @param {object} apMeta - The data returned from AP Media for a single article
 * @param {object} stationMappings - The station mappings that go with this AP Media article
 * @param {object} locals
 * @returns {Promise<void>}
 */
async function importArticle(apMeta) {
  return { isApContentPublishable: checkApPublishable(apMeta) };
}

module.exports  = {
  _internals: __,
  importArticle
};
