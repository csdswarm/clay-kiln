'use strict';

const { createPage } = require('../../services/server/page-utils'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

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
};
