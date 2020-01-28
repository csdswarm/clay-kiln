'use strict';

const mediaplay = require('./media-play'),
  responsiveImages = require('./responsive-images'),
  formatTime = require('./format-time'),
  dateTime = require('./dateTime'),
  truncate = require('./truncate'),
  ellipsisSubstring = require('./ellipsisSubstring'),
  { yesNo } = require('./utils');

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
  isPublished24HrsAgo: formatTime.isPublished24HrsAgo,
  timeAgoTimestamp: formatTime.timeAgoTimestamp,
  truncateText: truncate,
  ellipsisSubstring: ellipsisSubstring,
  calloutType: require('./callout'),
  attachSpaPayloadToWindow: require('./attachSpaPayloadToWindow'),
  reversibleOneBasedIndex: require('./reversibleOneBasedIndex'),
  userLocalDate: dateTime.userLocalDate,
  renderTemplateString: require('./renderTemplateString'),
  yesNo: yesNo
};
