'use strict';

const { playingClass } = require('../../services/universal/spaLocals');

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
