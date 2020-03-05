'use strict';

const axios = require('axios'),
  allow404 = status => {
    return (status >= 200 && status < 300)
      || status === 404;
  };

/**
 * Important: this api should be in sync with services/server/get-image-info.js
 *
 * Takes a url and returns an object with the following schema
 * {
 *   is404: <boolean>
 *   dimensions: {
 *     width: <number>
 *     height: <number>
 *   }
 *   fileSizeInBytes: <number>
 * }
 *
 * where if 'is404' is true, then the other properties will not be present
 *
 * @param {string} url
 * @returns {object}
 */
module.exports = async url => {
  const resp = await axios.get(
    '/image-info?url=' + encodeURIComponent(url),
    { validateStatus: allow404 }
  );

  return resp.status === 404
    ? { is404: true }
    : resp.data;
};
