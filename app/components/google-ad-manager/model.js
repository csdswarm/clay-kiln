'use strict';

const { DEFAULT_STATION } = require('../../services/universal/constants'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render(ref, data, locals) {
    const isDefaultStation = locals.station.id === DEFAULT_STATION.id;

    return {
      ...data,
      doubleclickBannerTag: isDefaultStation
        ? process.env.DOUBLECLICK_BANNER_TAG
        : locals.station.doubleclick_bannertag,
      environment: process.env.NODE_ENV,
      adRefreshInterval: process.env.GOOGLE_AD_REFRESH_INTERVAL
    };
  }
});
