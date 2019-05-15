'use strict';

module.exports['1.0'] = function (uri, data) {
  data.anchorId = data.anchorId || '';
  return data;
};
