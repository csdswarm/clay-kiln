'use strict';

const radioApi = require('../../services/server/radioApi');

module.exports.render = async (uri, data, locals) => {
  if (locals.stationId) {
    const station = await radioApi.get(`/stations/${locals.stationId}`);

    locals.station = station.data.attributes;
  }

  if (!locals.station) {
    return data;
  }
  data.station = locals.station;

  return data;
};
