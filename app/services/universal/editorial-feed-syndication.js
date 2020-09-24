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
    const editorialSyndicationEntries = await getSyndicatedStations(data),
      otherSyndicationEntries = _reject(data.stationSyndication, { source: 'editorial feed' }),
      unsubscribedSyndicationEntries = _filter(
        data.stationSyndication,
        { unsubscribed: true, source: 'editorial feed' }
      );
    
    // stationSyndication entries must contain any entry unrelated to editorial feed,
    //  syndication entries with the property 'unsubscribed=true' and a set of filtered editorial fetched from db.
    data.stationSyndication = otherSyndicationEntries.concat(unsubscribedSyndicationEntries, editorialSyndicationEntries);
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
    unsubscribedSyndicationEntries = _filter(
      data.stationSyndication,
      { unsubscribed: true, source: 'editorial feed' }
    ),
    // remove elements from the editorialSyndicationEntries that matches unsubscribed ones.
    filteredSyndicationEntries = _differenceBy(syndicatedStations, unsubscribedSyndicationEntries, 'callsign');

  return filteredSyndicationEntries;
}

module.exports.addStationsByEditorialGroup = addStationsByEditorialGroup;
