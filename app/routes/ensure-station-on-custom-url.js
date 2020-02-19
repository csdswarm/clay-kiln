'use strict';

const stationUtils = require('../services/server/station-utils'),
  { getComponentData } = require('../services/server/db'),
  { wrapInTryCatch } = require('../services/startup/middleware-utils'),
  { URL } = require('url'),
  { isPageMeta } = require('clayutils'),
  _get = require('lodash/get'),
  { DEFAULT_STATION } = require('../services/universal/constants'),
  rdcSlug = DEFAULT_STATION.site_slug,
  /**
   * Ensures the custom url has a pathname which starts with the correct
   *   station slug
   *
   * @param {string} customUrl
   * @param {string} stationSlug
   * @returns {string}
   */
  sanitizeCustomUrl = (customUrl, stationSlug) => {
    const url = new URL(customUrl),
      beginsWithStationSlugRe = new RegExp(`^/${stationSlug}/`);

    if (beginsWithStationSlugRe.test(url.pathname)) {
      return customUrl;
    }

    url.pathname = '/' + stationSlug + url.pathname;

    return url.toString();
  };

/**
 * This method ensures a page with custom url is prepended with the appropriate
 *   station slug if one exists.  It also validates the custom url to make sure
 *   it contains only the station the content is assigned to.
 *
 * @param {object} router
 */
module.exports = router => {
  router.put('/_pages/*', wrapInTryCatch(async (req, res, next) => {
    const customUrl = req.body.url;

    if (
      isPageMeta(req.uri)
      // if there's no custom url then there's nothing to do.
      || !customUrl
    ) {
      return next();
    }

    // shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const [station, componentData] = await Promise.all([
        stationUtils.getStationFromOriginalUrl({
          locals: res.locals,
          url: customUrl
        }),
        getComponentData(req.body.main[0])
      ]),
      stationSlugFrom = {
        customUrl: _get(station, 'site_slug', rdcSlug),
        component: _get(componentData, 'stationSlug', rdcSlug)
      },
      // if the station slug from the component is falsey, then the content
      //   belongs to the national station
      contentBelongsToNationalStation = !stationSlugFrom.component;

    if (contentBelongsToNationalStation && stationSlugFrom.customUrl) {
      res.status(400).send({
        error: 'This content belongs to the national station but the custom url'
          + " begins with a station slug which isn't allowed"
          + '\ncustomUrl: ' + customUrl
          + '\nstation slug extracted: ' + stationSlugFrom.customUrl
      });
      return;
    } else if (!contentBelongsToNationalStation) {
      const customUrlObj = new URL(customUrl),
        isOnlyStationSlugRe = new RegExp(`^/${stationSlugFrom.component}/?$`);

      // if the custom url exists but it's only the station slug that means the
      //   user typed just the station slug and nothing else which isn't allowed
      if (isOnlyStationSlugRe.test(customUrlObj.pathname)) {
        res.status(400).send({
          error: 'The custom url cannot just be the station slug'
            + '\ncustom url: ' + customUrl
            + '\nstation slug: ' + stationSlugFrom.component
        });
        return;
      }

      req.body.url = sanitizeCustomUrl(customUrl, stationSlugFrom.component);
    }

    next();
  }));
};
