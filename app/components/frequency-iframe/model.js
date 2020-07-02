'use strict';

const { isMigrated } = require('../../services/universal/stations'),
  url = require('url');

module.exports.render = async (ref, data, locals) => {
  const frequencyUrl = url.parse(locals.url),
    [,stationSlug] = frequencyUrl.path.split('/'),
    filters = ['_pages', '_components'];
    
  if (stationSlug && !filters.includes(stationSlug)) {
    const isStationMigrated = await isMigrated(stationSlug, locals);

    if (!isStationMigrated) {
      throw new Error(`Station ${stationSlug}, has not been migrated yet`);
    }
  }
  return data;
};
