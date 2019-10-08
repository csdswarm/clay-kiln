'use strict';

const stationUtils = require('../services/server/station-utils'),
  { getComponentData } = require('../services/server/db'),
  { wrapInTryCatch } = require('../services/startup/middleware-utils'),
  { URL } = require('url'),
  /**
   * If the request contains a content type type with a station, then prepend
   *   the station slug to the custom url path
   *
   * @param {object} req
   * @returns {string}
   */
  ensureUrlHasStationIfNeccessary = async req => {
    const { stationSlug } = await getComponentData(req.body.main[0]);

    if (!stationSlug) {
      return req.body.url;
    }

    // shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const url = new URL(req.body.url);

    url.pathname = '/' + stationSlug + url.pathname;

    return url.toString();
  };

/**
 * Thie method ensures a page with custom url is prepended with the appropriate
 *   station slug if one exists.
 *
 * @param {object} router
 */
module.exports = router => {
  router.put('/_pages/*', wrapInTryCatch(async (req, res, next) => {
    const customUrl = req.body.url;

    // if there's no custom url then there's nothing to do
    if (!req.body.url) {
      return next();
    }

    // shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const station = await stationUtils.getStationFromOriginalUrl(customUrl);

    // if the url already has a station slug then there's nothing more to do
    if (station) {
      return next();
    }

    req.body.url = await ensureUrlHasStationIfNeccessary(req);
    next();
  }));
};
