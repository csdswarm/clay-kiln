'use strict';

const db = require('../../services/server/db'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  _get = require('lodash/get'),
  rest = require('../../services/universal/rest'),
  utils = require('../../services/universal/utils');

module.exports = router => {
  router.post('/rdc/syndication', wrapInTryCatch(async (req, res) => {
    const { uri, station } = req.body,
      contentData = await db.get(uri);

    await db.put(uri, contentData, station);

    res.status(200);
    res.send(contentData);
  }));
};

/**
 * get page URI from content URI
 * @param  {string} contentURI
 * @return {string}
 */
async function getPageURI(contentURI) {
  const query = `SELECT p.id
    FROM pages p
    WHERE data->>'main' ~ '${contentURI}'`;

  return await db.raw(query).then(results => _get(results, 'rows[0].id'));
};

/**
 * remove Syndication entry from content data
 * @param  {string} uri
 * @param  {string} callsign
 */
async function removeSyndicationEntry(uri, callsign) {
  const data = await db.get(uri),
    stationSyndication = data.stationSyndication.filter(syndicated => syndicated.callsign !== callsign ),
    pageURI = await getPageURI(uri);

  data.stationSyndication = stationSyndication;

  await db.put(uri, data);
  await rest.put(`${utils.uriToUrl(pageURI)}@published`, {}, true);
}

module.exports = router => {
  router.put('/rdc/unpublish-syndication', wrapInTryCatch(async (req, res) => {
    const { uri, station } = req.body;

    await removeSyndicationEntry(uri.replace('@published', ''), station.callsign);

    res.status(200);
    res.send('success');
  }));
};
