'use strict';

const
  _get = require('lodash/get'),
  { createPage } = require('../../services/server/page-utils'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  db = require('../../services/server/db'),
  utils = require('../../services/universal/utils'),

  removeSectionFronts = (content) => ({
    ...content,
    secondarySectionFront: '',
    sectionFront: ''
  }),

  updateSyndication = (content, ogCanonicalUrl) => ({
    ...content,
    corporateSyndication: null,
    editorialFeeds: null,
    genreSyndication: null,
    isCloned: true,
    stationSyndication: [],
    syndicatedUrl: ogCanonicalUrl,
    syndicationStatus: 'syndicated'
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

    const result = await createPage(pagesUri, pageBody, stationSlug, locals);

    res.status(201);
    res.send(result);
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

    const result = await createPage(pagesUri, pageBody, stationSlug, locals),
      resultContentUri = result.main[0],
      resultContent = await db.get(resultContentUri),
      unsyndicatedContent = updateSyndication(resultContent, canonicalUrl),
      updatedContent = removeSectionFronts(unsyndicatedContent);

    await db.put(resultContentUri, updatedContent);

    res.status(201);
    res.send(result);
  }));
};
