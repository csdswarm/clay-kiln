'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  _get = require('lodash/get'),
  { getStationPage, getStationNav } = require('../../services/server/stationThemingApi');

module.exports.render = async (ref, data, locals) => {
  const { station, defaultStation } = locals,
    { slug } = station,
    isDefaultStation = slug === defaultStation.slug,
    isDefaultRef = /instances\/default/.test(ref);

  let instanceData = Object.assign({}, data, { _computed: {
    renderForStation: !isDefaultStation || !isDefaultRef
  } });

  if (isDefaultRef && !isDefaultStation) {
    const stationPageData = getStationPage(slug);

    if (stationPageData) {
      instanceData = Object.assign(instanceData, await getStationNav(stationPageData));
    } else {
      instanceData._computed.renderForStation = false;
    }
  }

  instanceData.playingClass = playingClass(locals, locals.station.id);
  instanceData.station = locals.station;

  // Don't default to what's in locals.station unless it's not the default station
  if (_get(locals, 'station.slug', 'www') === 'www') {
    instanceData.stationLogo = instanceData.stationLogo || '';
  } else {
    instanceData.stationLogo = instanceData.stationLogo || _get(locals, 'station.square_logo_small', '');
  }

  if (instanceData.stationLogo.length) {
    instanceData.stationLogo = instanceData.stationLogo.includes('?') ?
      `${ instanceData.stationLogo }&` :
      `${ instanceData.stationLogo }?`;
  }

  return instanceData;
};
