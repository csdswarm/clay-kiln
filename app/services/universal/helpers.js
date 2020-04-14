'use strict';

const
  attachSpaPayloadToWindow = require('./attachSpaPayloadToWindow'),
  byline = require('./byline'),
  calloutType = require('./callout'),
  dynamicImage = require('./dynamic-image'),
  ellipsisSubstring = require('./ellipsisSubstring'),
  reversibleOneBasedIndex = require('./reversibleOneBasedIndex'),
  sanitizeURI = require('./sanitizeURI'),
  truncate = require('./truncate'),
  {
    formatDateRange,
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
  imgSize,
  imgSource,
  isPublished24HrsAgo,
  renderTemplateString: require('./renderTemplateString'),
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
  userLocalDate,
  withoutResolution: getRenditionWithoutPixelDensity,
  yesNo
};
