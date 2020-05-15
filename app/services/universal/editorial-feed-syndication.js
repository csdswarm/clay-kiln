'use strict';

let allStations = null,
  editorialGroupsByStation = null;

const rest = require('./rest'),
  { getAllStations } = require('../server/station-utils'),
  boolObjectToArray = (obj) => Object.entries(obj || {}).map(([key, bool]) => bool && key).filter(value => value),
  _intersection = require('lodash/intersection');
  // stationExists = (stations, slug) => stations.some(station => station.stationSlug === slug);
  
async function addStationsByEditorialGroup(data, locals) {
  if (['article', 'gallery'].includes(data.contentType) && locals.station) {

    if (!editorialGroupsByStation) {
      editorialGroupsByStation = await rest.get(`${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }/rdc/editorial-group`);
    }

    if (!allStations) {
      allStations = await getAllStations.bySlug({ locals });
    }

    const syndicatedStations = editorialGroupsByStation.map(station => {
      const stationSubscribedToAnyEditorialFeed = _intersection(boolObjectToArray(station.data.feeds), boolObjectToArray(data.editorialFeeds)).length > 0;

      if (stationSubscribedToAnyEditorialFeed && station.data.siteSlug !== data.stationSlug) {
        const { sectionFront, secondarySectionFront } = data,
          { callsign, name } = allStations[station.data.siteSlug];

        return {
          callsign,
          stationName: name,
          stationSlug: station.data.siteSlug,
          ...sectionFront && { sectionFront },
          ...secondarySectionFront && { secondarySectionFront },
          source: 'editorial feed'
        };
      }
    }).filter(Boolean);

    data.stationSyndication = [
      ...data.stationSyndication,
      ...syndicatedStations
    ];
  }
}

module.exports.addStationsByEditorialGroup = addStationsByEditorialGroup;
