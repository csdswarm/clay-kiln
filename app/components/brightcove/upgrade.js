'use strict';

const apiHelper = require('./api-helper');

module.exports['1.0'] = async (uri, data) => {
  if (data.videoId) {
    return await apiHelper.addVideoDetails(data);
  }
  return data;
};

module.exports['2.0'] = function (uri, data) {
  
  let newData = Object.assign({}, data);

  if (newData.videoId) {
    newData.video = {
      id: newData.videoId,
      imageUrl: '',
      name: ''
    };
  } else {
    newData.video = null;
  }
  delete newData.videoId;

  return newData;
};
