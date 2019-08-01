'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  { getNowPlaying, getShowOnAir } = require('../../services/universal/station');

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await Promise.all([getNowPlaying(data, locals), getShowOnAir(data, locals)]);

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
