'use strict';

const _get = require('lodash/get'),
  _reject = require('lodash/reject'),
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
      { callsign, name: stationName, site_slug: stationSlug, mapped_section_fronts: mappedSectionFronts } = station,
      primarySectionFrontMapped = _get(mappedSectionFronts,'primarySectionFront', false) ? _get(mappedSectionFronts,'primarySectionFront', '') : sectionFront,
      secondarySectionFrontMapped = _get(mappedSectionFronts,'primarySectionFront', false) ? _get(mappedSectionFronts,'secondarySectionFront', '') : secondarySectionFront;

    return {
      callsign,
      stationName,
      stationSlug,
      ...primarySectionFrontMapped && { sectionFront: primarySectionFrontMapped },
      ...secondarySectionFrontMapped && { secondarySectionFront: secondarySectionFrontMapped },
      source: 'content subscription'
    };
  });
}

module.exports = applyContentSubscriptions;
