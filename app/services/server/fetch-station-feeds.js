'use strict';
const radioApiService = require('./radioApi'),
  // Only used server-side
  log = require('../../services/universal/log').setup({ file: __filename });

module.exports  = async (data, locals) => {
  try {
    if (locals && locals.site) {
      const url = `${locals.site.protocol}://${locals.site.host}/rdc/fetch-station-feeds?feedURL=${encodeURI(data.rssFeed)}`,
        feed = await radioApiService.get(url, null, (response) => response.nodes, {}, locals);

      return feed;
    }
  } catch (error) {
    log('error', 'error fetching station feed', error);
    return data;
  }
};

