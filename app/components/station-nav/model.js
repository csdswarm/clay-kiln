'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  _get = require('lodash/get');

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  // Don't default to what's in locals.station unless it's not the default station
  if (_get(locals, 'station.slug', 'www') === 'www') {
    data.stationLogo = data.stationLogo || '';
  } else {
    data.stationLogo = data.stationLogo || _get(locals, 'station.square_logo_small', '');
  }

  if (data.stationLogo.length) {
    data.stationLogo = data.stationLogo.includes('?') ?
      `${ data.stationLogo }&` :
      `${ data.stationLogo }?`;
  }

  return data;
};
