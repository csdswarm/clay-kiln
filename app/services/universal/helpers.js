'use strict';

const mediaplay = require('./media-play'),
  responsiveImages = require('./responsive-images'),
  formatTime = require('./format-time'),
  truncate = require('./truncate');

module.exports = {
  byline: require('./byline'),
  rendition: mediaplay.getRendition,
  renditionDynamic: mediaplay.getDynamicRendition,
  renditionAspectRatio: mediaplay.getRenditionAspectRatio,
  renditionHeight: mediaplay.getRenditionHeight,
  renditionSizes: responsiveImages.getSizes,
  renditionSourceSet: responsiveImages.getSourceSet,
  renditionWidth: mediaplay.getRenditionWidth,
  withoutResolution: mediaplay.getRenditionWithoutPixelDensity,
  dynamicImage: require('./dynamic-image'),
  secondsToISO: formatTime.secondsToISO,
  formatDateRange: formatTime.formatDateRange,
  truncateText: truncate,
  calloutType: require('./callout')
};
