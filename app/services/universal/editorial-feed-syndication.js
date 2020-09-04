'use strict';

const _differenceBy = require('lodash/differenceBy'),
  _intersection = require('lodash/intersection'),
  _filter = require('lodash/filter'),
  _reject = require('lodash/reject'),
  { boolObjectToArray } = require('./utils'),
  getEditorialGroups = require('../server/get-editorial-groups');

/**
 * Add syndication entries for stations subscribed to editorial groups
 * @param {Object} data
 * @param {Object} locals
 */
async function addStationsByEditorialGroup(data, locals) {
  if (['article', 'gallery'].includes(data.contentType) && locals.station) {
    const stationsSubscribed = await getSyndicatedStations(data),
      syndicatedStations = _reject(data.stationSyndication, { source: 'editorial feed' });


    data.stationSyndication = syndicatedStations.concat(stationsSubscribed);
  }
}

/**
 * Get stations subscribed to editorial feeds assigned to the content
 * @param {Object} data
 * @returns {array}
 */
async function getSyndicatedStations(data) {
  // when no editorial feed selected, we don't look for subscriptions
  if (!data.editorialFeeds) {
    return [];
  }

  const editorialGroups = await getEditorialGroups(),

    syndicatedStations = (editorialGroups || []).map(({ data: station }) => {
      const stationSubscribedToAnyEditorialFeed = _intersection(
        boolObjectToArray(station.feeds),
        boolObjectToArray(data.editorialFeeds)
      ).length > 0;

      /*
        station syndication must be added once per editorial feed. i.e if the content has two
        or more editorial feed assigned to the same station, we need to create
        only one syndication entry. Also, we don't want to create a syndication entry when the
        originating site is subscribed to any editorial feed of the content.
      */
      if (stationSubscribedToAnyEditorialFeed && station.siteSlug !== data.stationSlug) {
        const { sectionFront, secondarySectionFront } = data,
          { callsign, stationName, siteSlug: stationSlug } = station;

        return {
          callsign,
          stationName,
          stationSlug,
          ...sectionFront && { sectionFront },
          ...secondarySectionFront && { secondarySectionFront },
          source: 'editorial feed'
        };
      }
    }).filter(Boolean),
    unsubscribed = _filter(
      data.stationSyndication,
      { unsubscribed: true, source: 'editorial feed' }
    ),
    // remove elements from the content subscription that matches unsubscribed ones.
    filteredStationSubscribed = _differenceBy(syndicatedStations, unsubscribed, 'callsign');

  return unsubscribed.concat(filteredStationSubscribed);
}

module.exports.addStationsByEditorialGroup = addStationsByEditorialGroup;
