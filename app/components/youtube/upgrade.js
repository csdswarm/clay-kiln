'use strict';

module.exports['1.0'] = function (uri, data, locals) { // eslint-disable-line no-unused-vars
  // Blank out all youtube playlist data
  data.videoPlaylist = '';

  return data;
};
