'use strict';

const _get = require('lodash/get'),
  _filter = require('lodash/filter'),
  _isEmpty = require('lodash/isEmpty'),
  _reject = require('lodash/reject'),
  db = require('../../services/server/db'),
  rest = require('../../services/universal/rest'),
  { uriToUrl } = require('../../services/universal/utils'),
  { addStationSyndicationSlugs, updateStationSyndicationType } = require('../../services/universal/create-content'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

/**
 * get page URI from content URI
 * @param  {string} contentURI
 * @return {string}
 */
async function getPageURI(contentURI) {
  const query = `SELECT p.id
      FROM pages p
      WHERE data#>>'{main,0}' = '${contentURI}'`;

  return await db.raw(query).then(results => _get(results, 'rows[0].id'));
}

/**
 * add a new entry to station syndication list
 * @param  {string} uri
 * @param  {object} syndicationEntry
 * @return {string}
 */
async function addSyndicationEntry(uri, syndicationEntry) {
  const data = await db.get(uri);

  updateStationSyndicationType(data);
  const unsubscribed = _filter(data.stationSyndication, { callsign: syndicationEntry.callsign, unsubscribed: true });


  if (!_isEmpty(unsubscribed)) {
    data.stationSyndication.forEach(syndication => {
      if (syndication.callsign === syndicationEntry.callsign) {
        syndication.unsubscribed = false;
        // Keep previous sectionFront.
      }
    });
  } else {
    data.stationSyndication.push({ ...syndicationEntry });
    addStationSyndicationSlugs(data);
  }

  await db.put(uri, data);
}

/**
 * remove entry from station syndication list
 * @param  {string} uri
 * @param  {string} callsign
 */
async function removeSyndicationEntry(uri, callsign) {
  const data = await db.get(uri),
    stationSyndication = data.stationSyndication.map(syndicated => {
      if (syndicated.callsign === callsign) {
        syndicated.unsubscribed = true;
      }
      return syndicated;
    });

  // removes manual syndications from entry.
  data.stationSyndication = _reject(stationSyndication, { source: 'manual syndication' });
  await db.put(uri, data);
}

module.exports = router => {
  router.post('/rdc/syndicated-content/create', wrapInTryCatch(async (req, res) => {
    const { uri, syndicationData } = req.body,
      latestUri = uri.replace('@published', ''),
      pageURI = await getPageURI(uri);

    await addSyndicationEntry(latestUri, syndicationData);
    await rest.put(uriToUrl(pageURI, res.locals), {}, true);

    res.send('success');
  }));

  router.post('/rdc/syndicated-content/unpublish', wrapInTryCatch(async (req, res) => {
    const { uri, station } = req.body,
      latestUri = uri.replace('@published', ''),
      pageURI = await getPageURI(uri);

    await removeSyndicationEntry(latestUri, station.callsign);
    await rest.put(uriToUrl(pageURI, res.locals), {}, true);

    res.send('success');
  }));
};
