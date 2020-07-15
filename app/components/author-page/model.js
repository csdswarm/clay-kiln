'use strict';

const { assignStationInfo } = require('../../services/universal/create-content');

module.exports.save = (uri, data, locals) => {
  assignStationInfo(uri, data, locals);

  return data;
};
