'use strict';

let stationEditorialGroups = null;

const rest = require('./rest'),
  { boolObjectToArray } = require('./utils'),
  _intersection = require('lodash/intersection'),
  filterSelectedStations = (stationSyndication) => stationSyndication.filter( ({ source }) => !source || source === 'manual syndication'),
  setStationEditorialGroups = async () => {
    // we set editorial group subscriptions once
    if (!stationEditorialGroups) {
      stationEditorialGroups = await rest.get(`${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }/rdc/editorial-group`);
    }
  };

/**
 * Add syndication entries for stations subscribed to editorial groups
 * @param {Object} data
 * @param {Object} locals
 */
async function addStationsByEditorialGroup(data, locals) {
  if (['article', 'gallery'].includes(data.contentType) && locals.station) {
    await setStationEditorialGroups();

    const selectedStations = filterSelectedStations(data.stationSyndication || []),
      syndicatedStations = getSyndicatedStations(data);

    data.stationSyndication = [
      ...selectedStations,
      ...syndicatedStations
    ];
  }
}

/**
 * Get stations subscribed to editorial feeds assigned to the content
 * @param {Object} data
 * @returns {array}
 */
function getSyndicatedStations(data) {
  return (stationEditorialGroups || []).map(({ data: station }) => {
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
  }).filter(Boolean);
}

module.exports.addStationsByEditorialGroup = addStationsByEditorialGroup;
