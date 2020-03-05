'use strict';

const { assignDimensionsAndFileSize } = require('../../services/universal/image-utils');


module.exports['1.0'] = async (uri, data) => {
  await assignDimensionsAndFileSize(uri, data);

  return data;
};
