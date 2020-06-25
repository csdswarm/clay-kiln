'use strict';

const _reject = require('lodash/reject'),
  getStationsSubscribedToContent = require('../../server/get-stations-subscribed-to-content');

/**
 * Add syndication entries for national subscriptions
 * @param {Object} data
 * @param {Object} locals
 */
async function applyNationalSubscriptions(data, locals) {
  if (['article', 'gallery'].includes(data.contentType)) {
    const stationsSubscribed = await getStationsSubscribed(data, locals),
      syndicatedStations = _reject(
        data.stationSyndication,
        { source: 'national subscription' }
      );

    data.stationSyndication = syndicatedStations.concat(
      stationsSubscribed
    );
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
      source: 'national subscription'
    };
  });
}

module.exports = applyNationalSubscriptions;
