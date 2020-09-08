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
    const contentSubscriptionEntries = await getStationsSubscribed(data, locals),
      otherSyndicationEntries = _reject(
        data.stationSyndication,
        { source: 'content subscription' }
      ),
      unsubscribedSyndicationEntries = _filter(
        data.stationSyndication,
        { unsubscribed: true, source: 'content subscription' }
      );

    // stationSyndication entries must contain any entry unrelated to content subscription,
    //  syndication entries with the property 'unsubscribed=true' and a set of filtered content subscriptions fetched from db.
    data.stationSyndication = otherSyndicationEntries.concat(unsubscribedSyndicationEntries, contentSubscriptionEntries);
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
    
  return filteredStationSubscribed;
}

module.exports = applyContentSubscriptions;
