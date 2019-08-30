'use strict';

/**
 * Transform station data into a global slug
 *
 * @param  {object} data
 * @return {String}
 */
function getStationSlug(station) {
  return station.site_slug || station.callsign || station.id;
}

module.exports.getStationSlug = getStationSlug;
