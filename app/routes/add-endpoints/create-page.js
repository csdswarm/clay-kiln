'use strict';

const amphora = require('amphora'),
  _get = require('lodash/get'),
  radioApiService = require('../../services/server/radioApi'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  /**
   * Finds the station name from the slug
   *
   * @param {string} slug
   * @returns {string}
   */
  getNameFromStationSlug = async slug => {
    const response = await radioApiService.get('stations', { page: { size: 1000 } }),
      stationFound = response.data.find(aStation => {
        return aStation.attributes.site_slug === slug;
      });

    return _get(stationFound, 'attributes.name');
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
      pagesUri = req.hostname + '/_pages/';

    if (!pageBody) {
      res.status(400);
      res.send({ error: "'pageBody' is required" });
      return;
    }

    if (stationSlug) {
      Object.assign(res.locals, {
        newPageStationSlug: stationSlug,
        stationName: await getNameFromStationSlug(stationSlug)
      });
    }

    // we need to mutate locals before declaring the result
    // eslint-disable-next-line one-var
    const result = await amphora.pages.create(pagesUri, pageBody, res.locals);

    res.status(201);
    res.send(result);
  }));
};
