'use strict';

const
  { db: amphoraDb, pages } = require('amphora'),
  { elastic } = require('amphora-search'),
  { get: dbGet } = require('./db'),
  { getAllStations } = require('./station-utils');

async function addStationSlug(uri, stationSlug) {
  const { elasticPut, amphoraDb } = __;
  
  if (!stationSlug) {
    return;
  }
  const meta = await amphoraDb.getMeta(uri),
    updatedMeta = { ...meta, stationSlug },
    data = await amphoraDb.putMeta(uri, updatedMeta);

  return elasticPut('pages', uri, data);
}

const __ = {
  addStationSlug,
  amphoraDb,
  createAmphoraPage: pages.create,
  dbGet,
  elasticPut: elastic.put,
  getAllStations
};

/**
 * Creates a new page from a template, and adds the station slug to it.
 * @param {object} pageBody
 * @param {string} stationSlug
 * @param {object} locals
 * @returns {Promise<object>}
 */
async function createPage(pageBody, stationSlug, locals) {
  // pagesUri is required for the amphora.pages.create call
  const
    { addStationSlug, createAmphoraPage, getAllStations } = __,
    pagesUri = `${locals.site.host}/_pages/`;

  // stationSlug is valid due to a check in
  // app/services/server/permissions/has-permissions/create-page.js
  if (stationSlug) {
    const allStations = await getAllStations({ locals });

    locals.newPageStation = allStations.bySlug[stationSlug];
  }

  // we need to mutate locals before declaring the result
  const result = await createAmphoraPage(pagesUri, pageBody, locals);

  await addStationSlug(result._ref, stationSlug);

  return result;
}

module.exports = {
  _internals: __,
  createPage
};
