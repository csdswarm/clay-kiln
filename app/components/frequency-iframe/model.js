'use strict';

const frequencyIframeUrl  = require('../../services/universal/frequency-iframe-url'),
  { isMigrated } = require('../../services/universal/stations'),
  { unityComponent } = require('../../services/universal/amphora'),
  url = require('url');

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    const frequencyUrl = url.parse(locals.url),
      [,stationSlug] = frequencyUrl.path.split('/'),
      filters = ['_pages', '_components'];
  
    if (stationSlug && !filters.includes(stationSlug)) {
      const isStationMigrated = await isMigrated(stationSlug, locals);
  
      if (!isStationMigrated) {
        throw new Error(`Station ${stationSlug}, has not been migrated yet`);
      }
    }
    data._computed = {
      iframeUrl: frequencyIframeUrl(locals.url, locals.station.callsign)
    };
    return data;
  }
});

