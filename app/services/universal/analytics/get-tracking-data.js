'use strict';

const _get = require('lodash/get'),
  getPageId = require('./get-page-id'),
  makeFromPathname = require('./make-from-pathname');

/**
 * Gets the tracking data.  google-ad-manager/client.js uses this when the nmc
 *   tags are imported from an existing site.  When we don't have imported nmc
 *   tags, e.g. when we're rendering meta tags for an article created within
 *   unity, we pull (most of) the content directly from the nmc tags.
 *
 * @param {object} arg
 * @param {string} arg.pathname - the pathname of the requesting url
 * @param {object} arg.station - the current station object
 * @param {object} arg.pageData - the result of 'universal/analytics/get-tracking-page-data'
 * @param {string[]} arg.contentTags - the article or gallery tags
 * @returns {object}
 */
module.exports = function getTrackingData({ pathname, station, pageData, contentTags }) {
  const fromPathname = makeFromPathname({ pathname }),
    defaultCallsign = 'natlrc';

  return {
    cat: fromPathname.getCategory(station) || 'music',
    genre: fromPathname.getGenre(station) || 'aaa',
    pid: getPageId({ pageData, pathname }),
    tag: fromPathname.getTags(pageData, contentTags),
    market: fromPathname.isStationDetail()
      ? _get(station, 'market_name')
      : undefined,
    station: _get(station, 'callsign', defaultCallsign)
  };
};
