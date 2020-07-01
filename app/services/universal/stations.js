'use strict';

const queryService = require('../server/query'),
  log = require('./log').setup({ file: __filename });

/**
 * Transform station data into a global slug
 *
 * @param  {object} station
 * @return {String}
 */
function getStationSlug(station) {
  return station.site_slug || station.callsign || station.id;
}

/**
 * Determines whether or not a station is migrated, given the station slug
 * @param {string} stationSlug
 * @param {object} locals
 * @returns {Promise<boolean>}
 */
async function isMigrated(stationSlug, locals) {
  if (!stationSlug) {
    return false;
  }
  
  const query = queryService.newQueryWithCount('published-stations', 1, locals);

  queryService.addMust(query, { match: { stationSlug } });

  try {
    const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: false });

    return results.length > 0;
  } catch (e) {
    log('error', e);
    return false;
  }
};

module.exports.getStationSlug = getStationSlug;
module.exports.isMigrated = isMigrated;
