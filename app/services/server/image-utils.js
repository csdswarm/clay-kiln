'use strict';

const probeImageSize = require('probe-image-size'),
  _pick = require('lodash/pick');

/**
 * gets the dimensions of an imagive by url
 *
 * returns an object with the schema
 * {
 *   width: <Number>
 *   height: <Number>
 * }
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs = 5000]
 * @returns {object}
 */
const getDimensions = async (url, { timeoutMs = 5000 } = {}) => {
  try {
    const result = await probeImageSize(url, { timeout: timeoutMs });

    return _pick(result, ['width', 'height']);
  } catch (err) {
    err.message = `Error getting the dimensions for url '${url}'` + err.message;

    throw err;
  }
};

module.exports = { getDimensions };
