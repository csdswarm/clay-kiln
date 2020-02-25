'use strict';

const rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename, context: 'client' });

/**
 * call the get endpoint
 *
 * @param {string} site_slug
 *
 * @return {Promise<{}>}
 */
async function get(site_slug) {
  try {
    return await rest.get(`/station-theme/${site_slug}`);
  } catch (e) {
    log('error', e);
    return {};
  }
}

module.exports.inject = () => {};
module.exports.get = get;
