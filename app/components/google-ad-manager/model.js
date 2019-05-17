'use strict';

module.exports.render = function (ref, data) {
  return {...data, doubleclickBannerTag: process.env.DOUBLECLICK_BANNER_TAG};
};
