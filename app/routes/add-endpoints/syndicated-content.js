'use strict';

const _get = require('lodash/get'),
  db = require('../../services/server/db'),
  rest = require('../../services/universal/rest'),
  { uriToUrl } = require('../../services/universal/utils'),
  { addStationSyndicationSlugs } = require('../../services/universal/create-content'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

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
}

/**
 * add a new entry to station syndication list
 * @param  {string} uri
 * @param  {object} syndicationEntry
 * @return {string}
 */
async function addSyndicationEntry(uri, syndicationEntry) {
  const data = await db.get(uri);

  data.stationSyndication.push({ ...syndicationEntry });
  addStationSyndicationSlugs(data);

  await db.put(uri, data);
}

module.exports = router => {
  router.put('/rdc/create-syndication', wrapInTryCatch(async (req, res) => {
    const { uri, syndicationData } = req.body,
      latestUri = uri.replace('@published', ''),
      pageURI = await getPageURI(uri);

    await addSyndicationEntry(latestUri, syndicationData);
    await rest.put(uriToUrl(pageURI, res.locals), {}, true);

    res.status(200);
    res.send('success');
  }));
};
