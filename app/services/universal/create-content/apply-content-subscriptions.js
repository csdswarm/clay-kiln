'use strict';

const _reject = require('lodash/reject'),
  _filter = require('lodash/filter'),
  _concat = require('lodash/concat'),
  { filterUnsubscribedEntries } = require('../syndication-utils'),
  getStationsSubscribedToContent = require('../../server/get-stations-subscribed-to-content');

/**
 * Add syndication entries for content subscriptions
 * @param {Object} data
 * @param {Object} locals
 */
async function applyContentSubscriptions(data, locals) {
  if (['article', 'gallery'].includes(data.contentType)) {
    const stationsSubscribed = await getStationsSubscribed(data, locals),
      unsubscribed = _filter(
        data.stationSyndication,
        { unsubscribed: true, source: 'content subscription' }
      ),
      syndicatedStations = _reject(
        data.stationSyndication,
        { source: 'content subscription' }
      ),
      // remove elements from the content subscription that matches unsubscribed ones.
      filteredStationSubscribed = filterUnsubscribedEntries(unsubscribed, stationsSubscribed);
    
    data.stationSyndication = _concat(unsubscribed, syndicatedStations, filteredStationSubscribed);
  }
}

/**
 * Get syndication data for stations subscribed to content
 * @param {Object} data
 * @param {Object} locals
 * @returns {array}
 */
async function getStationsSubscribed(data, locals) {
  const stations = await getStationsSubscribedToContent(data, locals);

  return (stations || []).map(station => {
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
  });
}

module.exports = applyContentSubscriptions;
