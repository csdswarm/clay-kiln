'use strict';
const
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  logger = require('../../universal/log'),
  { createPage } = require('../page-utils'),
  { get: dbGet } = require('../db'),
  { getAllStations } = require('../station-utils'),
  { searchByQuery } = require('../query'),

  log = logger.setup({ file: __filename }),
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
    createPage,
    dbGet,
    getAllStations,
    log,
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
async function findExistingArticle({ itemid } = {}) {
  const
    { log, searchByQuery } = __,
    query = _set({ ...QUERY_TEMPLATE }, 'body.query.term[\'ap.itemid\']', itemid);

  try {
    const [existing] = await searchByQuery(query, null, { includeIdInResult: true });

    return existing;
  } catch (error) {
    log('error', 'Problem getting existing data from elastic', error);
  }
}

/**
 * Creates a new page and sets the station to the first station slug found
 * @param {object} stationMappings
 * @param {object} locals
 * @returns {Promise<Object>}
 */
async function createNewArticle(stationMappings, locals) {
  const newPage = await __.createPage(await __.dbGet('_pages/new-two-col'), Object.keys(stationMappings)[0] || '', locals);

  return _get(newPage, 'main.0');
}

async function getNewStations(article, stationMappings, locals) {
  const
    { getAllStations } = __,
    {
      sectionFront,
      stationSlug,
      stationSyndication
    } = article,
    syndicated = stationSyndication.map(({ stationSlug }) => stationSlug),
    stationEntries = Object.entries(stationMappings),
    stationsBySlug = await getAllStations.bySlug({ locals }),
    newStations = sectionFront
      ? stationEntries.filter(([key]) => key !== stationSlug && !syndicated.includes(key))
      : stationEntries;

  return newStations.map(([stationSlug, data]) => {
    const { callsign, name } = stationsBySlug[stationSlug];

    return {
      ...data,
      callsign,
      stationName: name,
      stationSlug
    };
  });
}

/**
 * Handles the logic needed to import or update an artice from the AP media api
 * @param {object} apMeta - The data returned from AP Media for a single article (the item property)
 * @param {object} stationMappings - The station mappings that go with this AP Media article
 * @param {object} locals
 * @returns {Promise<void>}
 */
async function importArticle(apMeta, stationMappings, locals) {
  const isApContentPublishable = checkApPublishable(apMeta),
    preExistingArticle = await findExistingArticle(apMeta.altids),
    article = preExistingArticle || await createNewArticle(stationMappings, locals),
    isModifiedByAP = apMeta.altids.etag !== _get(article, 'ap.etag'),
    newStations = await getNewStations(article, stationMappings);

  return {
    article,
    isApContentPublishable,
    isModifiedByAP,
    newStations,
    preExistingArticle
  };
}

module.exports = {
  _internals: __,
  importArticle
};
