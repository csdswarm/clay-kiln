'use strict';

const _isEqual = require('lodash/isEqual'),
  adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes;

module.exports['1.0'] = function (uri, data) {
  
  if (adSizes[data.adPosition] && _isEqual(adSizes[data.adPosition].defaultSize, [100, 35])) {
    data.adLocation = 'btf';
  }

  return data;
};
