'use strict';

const helpers = require('./helpers'),
  moment = require('moment');

module.exports.render = async (ref, data, locals) => {
  data.playHistory = await helpers.getPlayHistory(data.stationId);

  return data;
};
