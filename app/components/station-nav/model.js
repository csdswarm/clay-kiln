'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  _get = require('lodash/get'),
  { stationizedComponent } = require('../../services/universal/stationize');

module.exports = stationizedComponent({
  render: async (ref, data, locals) => {
    const { defaultStation } = locals;

    data._computed.playingClass = playingClass(locals, locals.station.id);

    // Don't default to what's in locals.station unless it's not the default station
    if (_get(locals, 'station.slug', defaultStation.slug) === defaultStation.slug) {
      data.stationLogo = data.stationLogo || '';
    } else {
      data.stationLogo = data.stationLogo || _get(locals, 'station.square_logo_small', '');
    }

    if (data.stationLogo.length) {
      data.stationLogo = data.stationLogo.includes('?') ?
        `${ data.stationLogo }&` :
        `${ data.stationLogo }?`;
    }
    if (!data.podcastsUrl) { // This should validates against null, undefined and blank values
      data.podcastsUrl = '/audio';
    }
    return data;
  }
});
