'use strict';

const qs = require('qs'),
  rest = require('../../services/universal/rest'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  importContentUrl = process.env.IMPORT_CONTENT_URL;

module.exports = router => {
  router.post('/import-content', wrapInTryCatch(async (req, res) => {
    const params = qs.stringify({ ...req.body, publish: false }),
      { results } = await rest.get(`${importContentUrl}?${params}`);

    res.send(results);
  }));
};
