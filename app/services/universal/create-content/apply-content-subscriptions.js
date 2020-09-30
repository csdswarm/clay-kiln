'use strict';

const _differenceBy = require('lodash/differenceBy'),
  _filter = require('lodash/filter'),
  _get = require('lodash/get'),
  _reject = require('lodash/reject'),
  getSubscriptionsWithStationProps = require('../../server/get-subscriptions-with-station-props');

/**
 * Add syndication entries for content subscriptions
 * @param {Object} data
 * @param {Object} locals
 */
async function applyContentSubscriptions(data, locals) {
  if (['article', 'gallery'].includes(data.contentType)) {
    const contentSubscriptionEntries = await getContentSubscriptionEntries(data, locals),
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
async function getContentSubscriptionEntries(data, locals) {
  const subscriptions = await getSubscriptionsWithStationProps(data, locals),
    stationsSubscribed = (subscriptions || []).map(subscription => {
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
    }),
    unsubscribed = _filter(
      data.stationSyndication,
      { unsubscribed: true, source: 'content subscription' }
    ),

    // remove elements from the content subscription that matches unsubscribed ones.
    filteredSubscriptionEntries = _differenceBy(stationsSubscribed, unsubscribed, 'callsign');
  
  return filteredSubscriptionEntries;
}

module.exports = applyContentSubscriptions;
