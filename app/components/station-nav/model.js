'use strict';

const { playingClass } = require('../../services/universal/spaLocals');

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;
  data.stationLogo = data.stationLogo || data.station.square_logo_small || 'https://images.radio.com/aiu-media/og_775x515_0.jpg';
  data.stationLogo = data.stationLogo.includes('?') ?
    `${ data.stationLogo }&` :
    `${ data.stationLogo }?`;

  return data;
};
