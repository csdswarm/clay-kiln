'use strict';

const axios = require('axios');

/**
 * gets the result via GET /rdc/station-feed-img-url
 *
 * @param {string} url
 * @param {object} [locals] - unused since we only want to log amphora timings on the server
 * @param {object} [argObj] - unused for the same reason as locals
 * @param {boolean} [argObj.shouldAddAmphoraTimings]
 * @param {string} [argObj.amphoraTimingLabelPrefix]
 * @returns {string}
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (url, locals, argObj) => {
  if (!url) {
    throw new Error('url cannot be falsey');
  }

  const { data } = await axios.get(`/rdc/s3-station-feed-img-url?url=${decodeURIComponent(url)}`);

  return data;
};
