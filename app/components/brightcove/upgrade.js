'use strict';

module.exports['1.0'] = function (uri, data) {
  
  let newData = Object.assign({}, data);

  if (!uri.includes('instances/new') && newData.videoId) {
    newData.video = {
      id: newData.videoId,
      imageUrl: '',
      name: ''
    };
  } else {
    newData.video = null
  }
  delete newData.videoId;

  return newData;
};
