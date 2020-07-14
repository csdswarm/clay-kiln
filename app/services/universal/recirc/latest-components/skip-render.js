'use strict';


const queryService = require('../../../server/query'),
  log = require('../../log').setup({ file: __filename }),
 
  /**
   * Determines whether or not a station is migrated, given the station slug
   * @param {string} stationSlug
   * @param {object} locals
   * @returns {Promise<boolean>}
   */
  isStationMigrated = async function (stationSlug, locals) {
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
  },
  skipRender = async (data, locals) => {
    const isStation = (data.populateFrom === 'station' && locals.params) || (data.populateFrom === 'rss-feed' && data.rssFeed !== '');

    if (isStation) {
      const slug = locals.station && locals.station.site_slug,
        isMigrated = await isStationMigrated(slug);

      data._computed.isMigrated = isMigrated;

      return !isMigrated;
    }

    return false;
  };

module.exports = skipRender;
