'use strict';

const apiHelper = require('./api-helper');

module.exports['1.0'] = async (uri, data) => {
  if (data.videoId) {
    return await apiHelper.addVideoDetails(data);
  }
  return data;
};
