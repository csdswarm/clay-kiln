'use strict';

module.exports['1.0'] = function (uri, data, locals) { // eslint-disable-line no-unused-vars
  // Blank out all youtube playlist data
  data.videoPlaylist = '';

  return data;
};

/**
 * Updates older data to version 2.0 when it is encountered
 * @param {string} uri not used
 * @param {object} data the legacy data to be updated
 * @param {object=} locals not used
 * @returns {*} updated data object
 */
module.exports['2.0'] = function (uri, data) {
  data.videoPlaylist = '';
  data.content = data.videoId;
  delete data.videoId;
  return data;
};
