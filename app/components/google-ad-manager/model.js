'use strict';

const { DEFAULT_STATION } = require('../../services/universal/constants'),
  { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  _pick = require('lodash/pick');

module.exports = unityComponent({
  render(ref, data, locals) {
    const isDefaultStation = locals.station.id === DEFAULT_STATION.id;

    data._computed.station = _pick(_get(locals, 'station'), ['callsign', 'category', 'genre_name[0]', 'market_name', 'site_slug'] );
    data._computed.station = JSON.stringify(data._computed.station);
    return {
      ...data,
      doubleclickBannerTag: isDefaultStation
        ? process.env.DOUBLECLICK_BANNER_TAG
        : locals.station.doubleclick_bannertag,
      environment: process.env.NODE_ENV,
      adRefreshInterval: process.env.GOOGLE_AD_REFRESH_INTERVAL,
      hasStationNav: locals.station && locals.station.id
    };
  }
});
