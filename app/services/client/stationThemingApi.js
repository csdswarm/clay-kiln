'use strict';

const rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename, context: 'client' });

/**
 * call the get endpoint
 *
 * @param {string} stationId
 *
 * @return {Promise<{}>}
 */
async function get(stationId) {
  try {
    // the endpoint does not use the siteSlug, so hard coding the text
    return await rest.get(`/station-theme/siteSlug/${stationId}`);
  } catch (e) {
    log('error', e);
    return {};
  }
}

module.exports.inject = () => {};
module.exports.get = get;
