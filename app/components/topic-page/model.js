'use strict';

const { assignStationInfo } = require('../../services/universal/create-content.js');

module.exports.save = (uri, data, locals) => {
  assignStationInfo(data, locals);

  return data;
};
