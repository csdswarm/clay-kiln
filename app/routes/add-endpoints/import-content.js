'use strict';

const qs = require('qs'),
  { updateMetaData } = require('../../services/server/update-metadata'),
  rest = require('../../services/universal/rest'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  importContentUrl = process.env.IMPORT_CONTENT_URL;

module.exports = router => {
  router.post('/import-content', wrapInTryCatch(async (req, res) => {
    const params = qs.stringify({ ...req.body, publish: false }),
      { results } = await rest.get(`${importContentUrl}?${params}`),
      { stationSlug } = req.body,
      metaDataModificationRequests = results.map(({ url }) => {
        const pagePathRaw = url.replace('.html', ''),
          ref = `${req.host}${pagePathRaw}`,
          fullUrl = `${req.protocol}://${ref}`;

        return updateMetaData(ref, {
          stationSlug,
          url: fullUrl,
          siteSlug: 'demo'
        });
      });
      
    await Promise.all(metaDataModificationRequests);

    res.send(results);
  }));
};
