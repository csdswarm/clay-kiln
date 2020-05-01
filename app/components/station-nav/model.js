'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  _get = require('lodash/get'),
  { getStationPage, getStationNav } = require('../../services/server/stationThemingApi'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    const { station, defaultStation } = locals,
      { site_slug } = station,
      isDefaultStation = site_slug === defaultStation.site_slug,
      isDefaultRef = /instances\/default/.test(ref);

    data._computed = {
      renderForStation: !isDefaultStation || !isDefaultRef
    };

    if (isDefaultRef && !isDefaultStation) {
      const stationPageData = await getStationPage(site_slug);

      if (stationPageData) {
        Object.assign(data, await getStationNav(stationPageData));
      } else {
        // There's no published station page, we shouldn't render the default nav
        data._computed.renderForStation = false;
      }
    }

    data.playingClass = playingClass(locals, locals.station.id);
    data.station = locals.station;

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

    return data;
  }
});
