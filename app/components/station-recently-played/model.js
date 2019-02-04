'use strict';

const helpers = require('./helpers'),
  moment = require('moment');

module.exports.render = async (ref, data, locals) => {
  data.station = locals.station || data.station;
  if (data.station) {
    data.playHistory = await helpers.getPlayHistory(data.station.id);
  }
  console.log('data', data)

  return data;
};
