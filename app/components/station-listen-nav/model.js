'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  { getNowPlaying, getSchedule } = require('../../services/universal/station');

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await Promise.all([
    getNowPlaying(locals.station.id, data),
    getSchedule(locals.station.id, locals, data, true)
  ]);

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
