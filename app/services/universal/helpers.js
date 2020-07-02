'use strict';

const
  attachSpaPayloadToWindow = require('./attachSpaPayloadToWindow'),
  byline = require('./byline'),
  calloutType = require('./callout'),
  dynamicImage = require('./dynamic-image'),
  ellipsisSubstring = require('./ellipsisSubstring'),
  renderTemplateString = require('./renderTemplateString'),
  reversibleOneBasedIndex = require('./reversibleOneBasedIndex'),
  sanitizeURI = require('./sanitizeURI'),
  truncate = require('./truncate'),
  toUpperCase = require('./toUpperCase'),
  {
    formatDateRange,
    formatDateTimeRange,
    isPublished24HrsAgo,
    secondsToISO,
    timeAgoTimestamp
  } = require('./format-time'),
  {
    getRendition,
    getRenditionAspectRatio,
    getDynamicRendition,
    getRenditionHeight,
    getRenditionWidth,
    getRenditionWithoutPixelDensity
  } = require('./media-play'),
  { getSizes, getSourceSet } = require('./responsive-images'),
  { userLocalDate } = require('./dateTime'),
  { yesNo } = require('./utils'),

  imgSize = ({ maxWidth, width }) => `${ maxWidth ? '(max-width: ' + maxWidth + '}px) ' : '' }${ width }px`,
  imgSource = ({ url, width, crop, offset }) =>
    `${ url }?width=${ width }&crop=${ crop }${ offset ? 'offset-' + offset : '' } ${ width }w`;

module.exports = {
  attachSpaPayloadToWindow,
  byline,
  calloutType,
  dynamicImage,
  ellipsisSubstring,
  formatDateRange,
  formatDateTimeRange,
  imgSize,
  imgSource,
  isPublished24HrsAgo,
  renderTemplateString,
  rendition: getRendition,
  renditionAspectRatio: getRenditionAspectRatio,
  renditionDynamic: getDynamicRendition,
  renditionHeight: getRenditionHeight,
  renditionSizes: getSizes,
  renditionSourceSet: getSourceSet,
  renditionWidth: getRenditionWidth,
  reversibleOneBasedIndex,
  sanitizeURI,
  secondsToISO,
  timeAgoTimestamp,
  truncateText: truncate,
  toUpperCase,
  userLocalDate,
  withoutResolution: getRenditionWithoutPixelDensity,
  yesNo
};
