'use strict';

const axios = require('axios');

/**
 * returns the content-length returned in a HEAD request for the url
 *
 * @param {string} url
 * @returns {Promise<number>}
 */
module.exports = async url => {
  const response = await axios.head(url),
    contentLength = response.headers['content-length'];

  if (contentLength) {
    return contentLength;
  }

  return Promise.reject(new Error(
    "the content-length response header doesn't exixt on the HEAD request"
    + `to '${url}'`
  ));
};
