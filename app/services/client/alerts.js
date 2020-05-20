'use strict';

const qs = require('qs'),
  rest = require('../universal/rest'),
  log = require('../../services/universal/log').setup({ file: __filename });

/**
 * Get the current alerts for a station from unity API
 *
 * @param {Object} params
 * @param {Bool} params.active
 * @param {Bool} params.current
 * @param {String} params.station
 * @param {object} [locals] - unused on the client. We're only adding amphora timings on server render.
 * @param {object} [argObj] - unused for the same reason.
 * @param {boolean} [argObj.shouldAddAmphoraTimings]
 * @param {string} [argObj.amphoraTimingLabelPrefix]
 */
// eslint-disable-next-line no-unused-vars
module.exports.getAlerts = async (params, locals, argObj = {}) => {
  try {
    return await rest.get(`/alerts?${qs.stringify(params)}`);
  } catch (err) {
    log('error', 'issue getting alerts', err);
    return [];
  }
};
