'use strict';

const amphora = require('amphora'),
  { elastic } = require('amphora-search'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  stationUtils = require('../../services/server/station-utils'),
  db = require('../../services/server/db'),
  _get = require('lodash/get'),
  axios = require('axios'),
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
    syndicationStatus: 'cloned'
  });
    
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

    // stationSlug is valid due to a check in
    // app/services/server/permissions/has-permissions/create-page.js
    if (stationSlug) {
      const allStations = await stationUtils.getAllStations({ locals });

      res.locals.newPageStation = allStations.bySlug[stationSlug];
    }

    // we need to mutate locals before declaring the result
    // eslint-disable-next-line one-var
    const result = await amphora.pages.create(pagesUri, pageBody, res.locals);
    
    await addStationSlug(result._ref, stationSlug);

    res.status(201);
    res.send(result);
  }));

  router.post('/clone-content', wrapInTryCatch(async (req, res) => {
    const { canonicalUrl, stationSlug } = req.body,
      pagesUri = req.hostname + '/_pages/',
      { locals } = res,
      url = canonicalUrl.split('//')[1],
      
      QUERY = `SELECT 
      u.data FROM uris u 
      WHERE u.url = '${url}'`,

      contentPageURL = await db.raw(QUERY).then(results => _get(results, 'rows[0].data'));
      
    let { data: pageBody } = await axios.get(utils.uriToUrl(`${contentPageURL}@published`, locals));
      
    if (!pageBody) {
      res.status(400).send({ error: 'Page not found' });
      return;
    }

    const contentUri = pageBody.main[0],
      layoutUri = utils.replaceVersion(pageBody.layout),
      content = await db.get(contentUri),
      updatedContent = updateSyndication(content);
    
    await db.put(contentUri, updatedContent);

    pageBody = {
      ...pageBody,
      layout: layoutUri
    };

    if (stationSlug) {
      const allStations = await stationUtils.getAllStations({ locals });

      res.locals.newPageStation = allStations.bySlug[stationSlug];
    }
    
    const result = await amphora.pages.create(pagesUri, pageBody, res.locals);

    await addStationSlug(result._ref, stationSlug);
    
    res.status(201);
    res.send(result);
  }));
};
