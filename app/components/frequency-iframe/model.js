'use strict';

const { isMigrated } = require('../../services/universal/stations'),
  { sendError } = require('../../services/universal/cmpt-error'),
  url = require('url');

module.exports.render = async (ref, data, locals) => {
  const frequencyUrl = url.parse(locals.url),
    [,stationSlug] = frequencyUrl.path.split('/');
  
  if (stationSlug) {
    const isStationMigrated = await isMigrated(stationSlug, locals);

    if (isStationMigrated) {
      return data;
    }
    return sendError(`Station ${stationSlug}, has not been migrated yet`, 404);
  }
};
