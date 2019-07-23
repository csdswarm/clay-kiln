'use strict';

const { playingClass } = require('../../services/universal/spaLocals');

module.exports.render = (ref, data, locals) => {
  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
