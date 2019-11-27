'use strict';

module.exports.render = function (ref, data) {
  return {
    ...data,
    doubleclickBannerTag: process.env.DOUBLECLICK_BANNER_TAG,
    environment: process.env.NODE_ENV,
    adRefreshInterval: process.env.GOOGLE_AD_REFRESH_INTERVAL
  };
};
