'use strict';

const bPromise = require('bluebird'),
  getRemoteFileSize = require('./get-remote-file-size'),
  imageUtils = require('./image-utils'),
  axios = require('axios'),
  allow404 = status => {
    return (status >= 200 && status < 300)
      || status === 404;
  };

/**
 * Important: this api should be in sync with services/client/get-image-info.js
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
  const result = await axios.head(url, { validateStatus: allow404 });

  if (result.status === 404) {
    return { is404: true };
  }

  return bPromise.props({
    dimensions: imageUtils.getDimensions(url),
    fileSizeInBytes: getRemoteFileSize(url)
  });
};
