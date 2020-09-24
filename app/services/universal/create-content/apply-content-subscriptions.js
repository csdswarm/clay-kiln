'use strict';

const _get = require('lodash/get'),
  _reject = require('lodash/reject'),
  getSubscriptionsWithStationProps = require('../../server/get-subscriptions-with-station-props');

/**
 * Add syndication entries for content subscriptions
 * @param {Object} data
 * @param {Object} locals
 */
async function applyContentSubscriptions(data, locals) {
  if (['article', 'gallery'].includes(data.contentType)) {
    const stationsSubscribed = await getContentSubscriptionEntries(data, locals),
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
async function getContentSubscriptionEntries(data, locals) {
  const subscriptions = await getSubscriptionsWithStationProps(data, locals);

  return (subscriptions || []).map(subscription => {
    const { sectionFront, secondarySectionFront } = data,
      { callsign, name: stationName, site_slug: stationSlug, mapped_section_fronts: mappedSectionFronts } = subscription,
      primarySectionFrontExists = _get(mappedSectionFronts,'primarySectionFront'),
      primarySectionFrontMapped = primarySectionFrontExists ? _get(mappedSectionFronts,'primarySectionFront') : sectionFront,
      secondarySectionFrontMapped = primarySectionFrontExists ? _get(mappedSectionFronts,'secondarySectionFront') : secondarySectionFront;

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
