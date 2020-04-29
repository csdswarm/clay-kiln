'use strict';

const { assignStationInfo } = require('../../services/universal/create-content.js');

module.exports.save = (uri, data, locals) => {
  assignStationInfo(uri, data, locals);

  return data;
};
