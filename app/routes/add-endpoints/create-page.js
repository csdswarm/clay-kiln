'use strict';

const amphora = require('amphora'),
  { elastic } = require('amphora-search'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  stationUtils = require('../../services/server/station-utils'),
  db = require('../../services/server/db'),
  _get = require('lodash/get'),
  utils = require('../../services/universal/utils'),
  addStationSlug = (uri, stationSlug) => stationSlug && amphora.db.getMeta(uri)
    .then(meta => ({ ...meta, stationSlug }))
    .then(updatedMeta => amphora.db.putMeta(uri, updatedMeta))
    .then(data => elastic.put('pages', uri, data)),
  updateSyndication = (content) => ({
    ...content,
    corporateSyndication: null,
    editorialFeeds: null,
    genreSyndication: null,
    stationSyndication: [],
    syndicatedUrl: null,
    syndicationStatus: 'original',
    isCloned: true
  }),
  // eslint-disable-next-line max-params
  createPage = async (uri, body, res, stationSlug, locals) => {
    if (stationSlug) {
      const allStations = await stationUtils.getAllStations({ locals });

      res.locals.newPageStation = allStations.bySlug[stationSlug];
    }

    const result = await amphora.pages.create(uri, body, res.locals);

    await addStationSlug(result._ref, stationSlug);

    return {
      result,
      res
    };
  };
    
module.exports = router => {
  router.post('/_pages', (req, res) => {
    res.status(404);
    res.send({
      error: "To create a page in unity use the '/create-page' endpoint instead"
    });
  });

  router.post('/create-page', wrapInTryCatch(async (req, res) => {
    const { pageBody, stationSlug } = req.body,
      // pagesUri is required for the amphora.pages.create call
      pagesUri = req.hostname + '/_pages/',
      { locals } = res;

    if (!pageBody) {
      res.status(400).send({ error: "'pageBody' is required" });
      return;
    }
    
    const { result, res: updatedResponse } = await createPage(pagesUri, pageBody, res, stationSlug, locals);

    updatedResponse.status(201);
    updatedResponse.send(result);
  }));

  router.post('/rdc/clone-content', wrapInTryCatch(async (req, res) => {
    const { canonicalUrl, stationSlug } = req.body,
      pagesUri = req.hostname + '/_pages/',
      { locals } = res,
      url = canonicalUrl.split('//')[1],
      
      QUERY = `SELECT p.data
      FROM uris u
        JOIN pages p
          ON u.data || '@published' = p.id
      WHERE u.url = ?`;

    let pageBody = await db.raw(QUERY, [url]).then(results => _get(results, 'rows[0].data'));
      
    if (!pageBody) {
      res.status(404).send({ error: 'Page not found' });
      return;
    }
    
    pageBody = {
      ...pageBody,
      layout: utils.replaceVersion(pageBody.layout)
    };
    
    const { result, res: updatedResponse } = await createPage(pagesUri, pageBody, res, stationSlug, locals),
      resultContentUri = result.main[0],
      resultContent = await db.get(resultContentUri),
      updatedContent = updateSyndication(resultContent);

    await db.put(resultContentUri, updatedContent);
    
    updatedResponse.status(201);
    updatedResponse.send(result);
  }));
};
