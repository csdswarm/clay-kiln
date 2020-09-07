'use strict';

const _reject = require('lodash/reject'),
  _filter = require('lodash/filter'),
  _differenceBy = require('lodash/differenceBy'),
  getStationsSubscribedToContent = require('../../server/get-stations-subscribed-to-content');

/**
 * Add syndication entries for content subscriptions
 * @param {Object} data
 * @param {Object} locals
 */
async function applyContentSubscriptions(data, locals) {
  if (['article', 'gallery'].includes(data.contentType)) {
    const stationsSubscribed = await getStationsSubscribed(data, locals),
      syndicatedStations = _reject(
        data.stationSyndication,
        { source: 'content subscription' }
      );
    
    data.stationSyndication = syndicatedStations.concat(stationsSubscribed);
  }
}

/**
 * Get syndication data for stations subscribed to content
 * @param {Object} data
 * @param {Object} locals
 * @returns {array}
 */
async function getStationsSubscribed(data, locals) {
  const stations = await getStationsSubscribedToContent(data, locals),

    stationsSubscribed = (stations || []).map(station => {
      const { sectionFront, secondarySectionFront } = data,
        { callsign, name: stationName, site_slug: stationSlug } = station;

      return {
        callsign,
        stationName,
        stationSlug,
        ...sectionFront && { sectionFront },
        ...secondarySectionFront && { secondarySectionFront },
        source: 'content subscription'
      };
    }),
    unsubscribed = _filter(
      data.stationSyndication,
      { unsubscribed: true, source: 'content subscription' }
    ),

    // remove elements from the content subscription that matches unsubscribed ones.
    filteredStationSubscribed = _differenceBy(stationsSubscribed, unsubscribed, 'callsign');
    
  return unsubscribed.concat(filteredStationSubscribed);
}

module.exports = applyContentSubscriptions;
