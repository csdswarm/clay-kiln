'use strict';

module.exports['1.0'] = function (uri, data) {
  let newData = Object.assign({}, data);

  newData.video = {
    id: newData.videoId,
    imageUrl: '',
    name: ''
  };
  
  delete newData.videoId;

  return newData;
};
