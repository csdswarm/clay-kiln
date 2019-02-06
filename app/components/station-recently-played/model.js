'use strict';

const helpers = require('./helpers'),
  { sendError } = require('../../services/universal/cmpt-error');

module.exports.render = async (ref, data, locals) => {
  data.station = locals.station || data.station;
  if (!data.station) {
    sendError(`No station supplied`, 404);
  }
  data.playHistory = await helpers.getPlayHistory(data.station.id);
  console.log('data', data)

  return data;
};
