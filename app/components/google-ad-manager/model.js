'use strict';

module.exports.render = function (ref, data, locals) {
  return {...data, doubleclickBannerTag: process.env.DOUBLECLICK_BANNER_TAG};
};
