'use strict';

const rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename, context: 'client' });

/**
 * call the get endpoint
 *
 * @param {string} site_slug
 * @param {*} defaultResult
 *
 * @return {Promise<{}>}
 */
async function get(site_slug, defaultResult = {}) {
  try {
    return await rest.get(`/station-theme/${site_slug}`);
  } catch (err) {
    log('error', err);

    return defaultResult;
  }
}

module.exports.inject = () => {};
module.exports.get = get;
