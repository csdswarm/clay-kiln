'use strict';

/*
 * This service enables the use of responsive images - i.e. img tags with
 * 'srcset' and 'sizes' attributes. Works with aspect-ratio-based renditions
 * which correspond to the rendition categories of the mediaplay service.
 * This is purely to ease use in components, where a single rendition can
 * be used with mediaplay (e.g. for img src) as well as here.
 */

const mediaplay = require('./media-play'),
  _isEmpty = require('lodash/isEmpty'),
  _isString = require('lodash/isString'),
  // NOTE: Sizes are tied to the current display of images. A better way of
  // managing these might be necessary if major layout changes are introduced.
  responsiveRenditions = {
    thumb:      {
      aspectRatio:  0.66,
      srcSetWidths: [107, 188, 215],
      layoutWidths: { sm: '107px', med: '215px', lg: '188px' }
    },
    square:     {
      aspectRatio:  1,
      srcSetWidths: [107, 190, 215],
      layoutWidths: { sm: '107px', med: '215px', lg: '190px' }
    },
    vertical:   {
      aspectRatio:  1.5,
      srcSetWidths: [107, 215, 245],
      layoutWidths: { sm: '107px', med: '215px', lg: '245px' }
    },
    horizontal: {
      aspectRatio:  0.66,
      srcSetWidths: [375, 540, 850],
      layoutWidths: { sm: '100vw', med: '82.5vw', lg: '536px' }
    },
    'cover-big': {
      aspectRatio:  1.333,
      srcSetWidths: [310, 500, 540],
      layoutWidths: { sm: '100vw', med: '82.5vw', lg: '1024px' }
    },
    'cover-small': {
      aspectRatio:  1.333,
      srcSetWidths: [310, 500, 310],
      layoutWidths: { sm: '100vw', med: '82.5vw', lg: '1024px' }
    },
    flex:       {
      aspectRatio:  -1,
      srcSetWidths: [375, 540, 850],
      layoutWidths: { sm: '100vw', med: '82.5vw', lg: '536px' }
    }
  },
  mediaConditionWidths = { med: '600px', lg: '1024px' },
  defaultRendition = 'horizontal';

/**
 * Check the rendition name passed in
 * @param {string} renditionName
 * @returns {string} A rendition name that can be used
 * @throws {Error} The name does not exist, and no suitable substitute was found
 */
function validateRenditionName(renditionName) {
  if (!renditionName) {
    return defaultRendition;
  } else if (responsiveRenditions[renditionName]) {
    return renditionName;
  } else {
    let nameParts = renditionName.split('-');

    if (responsiveRenditions[nameParts[0]]) {
      // we have a mediaplay rendition that we know how to handle
      return nameParts[0];
    } else {
      throw new Error(`Rendition "${renditionName}" not found`);
    }
  }
}

/**
 * Creates an individual image url and descriptor based on the image dimensions
 * @param {string} url
 * @param {number} width
 * @param {number} aspectRatio
 * @param {number} density
 * @returns {string}
 */
function getSourceWithDescriptor(url, width, aspectRatio, density) {
  var srcset,
    height = aspectRatio > 0 ? Math.floor(width * aspectRatio) : null,
    densityDesc = density === 2 ? '2x' : '1x';

  // image URL at this width
  srcset = mediaplay.getRenditionUrl(url, { w: width, h: height, r: densityDesc }, aspectRatio > 0);
  // append width for browser's information
  if (!_isEmpty(srcset)) {
    srcset += ` ${width * density}w`;
  }
  return srcset;
}

/**
 * Get a string to be used as the srcset attribute for a rendition.
 * Allows the browser to make the best choice between a range of images.
 * @param {string} url
 * @param {string} [renditionName=defaultRendition]
 * @returns {string}
 */
function getSourceSet(url, renditionName) {
  if (!_isString(url) || _isEmpty(url)) {
    return '';
  } else {
    renditionName = validateRenditionName(renditionName);

    let srcSetWidths = responsiveRenditions[renditionName].srcSetWidths,
      srcSets = [];

    // for each width to be included, create 1x and 2x density descriptors
    for (let i = 0; i < srcSetWidths.length; i++) {
      srcSets.push(getSourceWithDescriptor(url, srcSetWidths[i], responsiveRenditions[renditionName].aspectRatio, 1));
      srcSets.push(getSourceWithDescriptor(url, srcSetWidths[i], responsiveRenditions[renditionName].aspectRatio, 2));
    }

    return srcSets.join(',');
  }
}

/**
 * Get a string to be used as the sizes attribute for a rendition.
 * Provides information about image's rendered width across viewports.
 * @param {string} [renditionName=defaultRendition]
 * @returns {string}
 */
function getSizes(renditionName) {
  renditionName = validateRenditionName(renditionName);

  return `(min-width: ${mediaConditionWidths.lg}) ${responsiveRenditions[renditionName].layoutWidths.lg},
    (min-width: ${mediaConditionWidths.med}) ${responsiveRenditions[renditionName].layoutWidths.med},
    ${responsiveRenditions[renditionName].layoutWidths.sm}`;
}

module.exports.getSourceSet = getSourceSet;
module.exports.getSizes = getSizes;
