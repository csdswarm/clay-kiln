'use strict';

/* A NOTE ON VARIABLE HEIGHT RENDITIONS
 * Mediaplay will use the smallest dimension to resize images when you specify `nocrop`,
 * so we can set the variable dimension to the Int32 maximum and it will always work.
 * Ideally, mediaplay would be able to resize an image without us specifying
 * both width and height, but that's currently unsupported.
 */

var _initial = require('lodash/initial'),
  _includes = require('lodash/includes'),
  _isString = require('lodash/isString'),
  _isNumber = require('lodash/isNumber'),
  _get = require('lodash/get'),
  rest = require('./rest'),
  x2 = '2x',
  x1 = '1x',
  MAX_HEADROOM = 2147483647,
  renditions = {
    square:                   { w: 536, h: 536, r: x2 },
    'square-1x':              { w: 536, h: 536, r: x1 },
    'square-medium':          { w: 190, h: 190, r: x2 },
    'square-medium-zoom-small':{ w: 768, h: 768, r: x2 },
    'square-medium-zoom-medium':{ w: 1180, h: 1180, r: x2 },
    'square-medium-zoom-large':{ w: 1280, h: 1280, r: x2 },
    'square-small':           { w: 168, h: 168, r: x2 },
    'square-xsmall':          { w: 63,  h: 63,  r: x2 },
    'square-twitter-logo':    { w: 125, h: 125, r: x2 }, // used to brand logos twitter:image meta tags
    thumb:                    { w: 215, h: 143, r: x2 },
    'thumb-small':            { w: 168, h: 115, r: x2 },
    'thumb-zoom-small':       { w: 768, h: 511, r: x2 },
    'thumb-zoom-medium':      { w: 1180, h: 785, r: x2 },
    'thumb-zoom-large':       { w: 1280, h: 851, r: x2 },
    horizontal:               { w: 710, h: 473, r: x2 },
    'horizontal-zoom-small':  { w: 768, h: 512, r: x2 },
    'horizontal-zoom-medium': { w: 1180, h: 786, r: x2 },
    'horizontal-zoom-large':  { w: 1280, h: 853, r: x2 },
    'horizontal-small':       { w: 146, h: 97,  r: x2 },
    'horizontal-less-medium': { w: 235, h: 156, r: x2 },
    'horizontal-medium':      { w: 280, h: 157, r: x2 },
    'horizontal-largeish':    { w: 560, h: 314, r: x2 },
    'horizontal-large':       { w: 610, h: 410, r: x2 },
    'horizontal-newsletter':  { w: 600, h: 358, r: x1 },
    'feature-lede':           { w: 512, h: 600, r: x2 },
    'og:image':               { w: 1200,h: 630, r: x1 }, // special rendition for og:images, explicitly 1x
    'twitter:image':          { w: 600, h: 315, r: x2 }, // special rendition for twitter:image meta data
    vertical:                 { w: 536, h: 804, r: x2 }, // deprecated: photo wants to only use 'flex' for large vertical images
    'vertical-small':         { w: 245, h: 368, r: x2 },
    'vertical-small-zoom-small':{ w: 768, h: 1154, r: x2 },
    'vertical-small-zoom-medium':{ w: 1180, h: 1772, r: x2 },
    'vertical-small-zoom-large':{ w: 1280, h: 1923, r: x2 },
    'vertical-subscription':  { w: 47,  h: 61,  r: x2},
    // image-newfeed-lede and image-newsfeed-secondary component renditions:
    'newsfeed-lede-large':    { w: 670, h: 670, r:x2 },
    'travel-large-newsfeed-lede': { w: 670, h: 670, r:x2 },
    'newsfeed-lede-small':    { w: 300, h: 200, r:x2 },
    'newsfeed-square-small':  { w: 320, h: 320, r: x2 },
    'newsfeed-horizontal-large':{ w: 670, h: 450, r: x2 },
    'travel-small-newsfeed-lede': { w: 300, h: 200, r:x2 },
    // special renditions:
    flex:                     { w: 710, h: MAX_HEADROOM, r: x2 },
    'flex-zoom-small':        { w: 768, h: MAX_HEADROOM, r: x2 },
    'flex-zoom-medium':       { w: 1180, h: MAX_HEADROOM, r: x2 },
    'flex-zoom-large':        { w: 1280, h: MAX_HEADROOM, r: x2 },
    'flex-large':             { w: 1024,h: MAX_HEADROOM, r: x2 },
    'flex-large-zoom-small':  { w: 768, h: MAX_HEADROOM, r: x2 },
    'flex-large-zoom-medium': { w: 1180, h: MAX_HEADROOM, r: x2 },
    'flex-large-zoom-large':  { w: 1280, h: MAX_HEADROOM, r: x2 },
    'flex-xxsmall':           { w: 335, h: MAX_HEADROOM, r: x2 },
    'flex-small':             { w: 426, h: MAX_HEADROOM, r: x2 },
    'flex-small-zoom-small':  { w: 768, h: MAX_HEADROOM, r: x2 },
    'flex-small-zoom-medium': { w: 1180, h: MAX_HEADROOM, r: x2 },
    'flex-small-zoom-large':  { w: 1280, h: MAX_HEADROOM, r: x2 },
    'flex-medium-small':      { w: 512, h: MAX_HEADROOM, r: x2 },
    'flex-medium':            { w: 670, h: MAX_HEADROOM, r: x2 },
    'flex-medium-large':      { w: 800, h: MAX_HEADROOM, r: x2 },
    'flex-xlarge':            { w: 1600, h: MAX_HEADROOM, r: x2 },
    'flex-newsletter':        { w: 600, h: MAX_HEADROOM, r: x1 },
    'vertical-small-variable':{ w: 250, h: MAX_HEADROOM, r: x2 }, // not currently used (might be in the future!)
    'travel-horizontal-large':{ w: 670, h: 450 },
    'travel-square-small':    { w: 320, h: 320 },
    'cut-section-vid':        { w: 336, h: 255, r: x2 },
    // original:                original image w/h
    'cut-hp-square-1x':       { w: 600, h: 600, r: x1 },
    'cut-hp-square-2x':       { w: 600, h: 600, r: x2 },
    // homepage components:
    'homepage-article-promo-small-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-small-medium':{ w: 180, h: 180, r: x2 },
    'homepage-article-promo-small-large':{ w: 240, h: 240, r: x2 },
    'homepage-article-promo-package-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-package-medium':{ w: 200, h: 200, r: x2 },
    'homepage-article-promo-package-large':{ w: 300, h: 300, r: x2 },
    'homepage-article-promo-medium-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-medium-medium':{ w: 240, h: 240, r: x2 },
    'homepage-article-promo-medium-large':{ w: 340, h: 340, r: x2 },
    'homepage-article-promo-large-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-large-medium':{ w: 300, h: 300, r: x2 },
    'homepage-article-promo-large-large':{ w: 380, h: 380, r: x2 },
    'homepage-article-promo-xlarge-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-xlarge-medium':{ w: 300, h: 300, r: x2 },
    'homepage-article-promo-xlarge-large':{ w: 480, h: 480, r: x2 },
    'homepage-article-promo-huge-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-huge-medium':{ w: 340, h: 340, r: x2 },
    'homepage-article-promo-huge-large':{ w: 560, h: 560, r: x2 },
    'homepage-article-promo-lede-small':{ w: 727, h: 933, r: x2 },
    'homepage-article-promo-lede-medium':{ w: 300, h: 300, r: x2 },
    'homepage-article-promo-lede-large':{ w: 480, h: 480, r: x2 },
    'homepage-article-promo-video-small':{ w: 727, h: 555, r: x2 },
    'homepage-article-promo-section-small':{ w: 727, h: 727, r: x2 },
    'homepage-article-promo-section-medium':{ w: 300, h: 300, r: x2 },
    'homepage-article-promo-section-large':{ w: 430, h: 430, r: x2 },
    'homepage-excerpt': { w: 255, h: 255, r: x2 },
    'homepage-top-lede-small':  { w: 335, h: 430, r: x2 },
    'homepage-top-lede-medium':  { w: 640, h: 640, r: x2 },
    'homepage-article-bar': { w: 220 , h: 220, r: x1 }, // the mediaplay server is having issues with delays in 2x renditions when a specific rendition is manually uploaded, so we're setting this to use a 1x rendition
    'fashion-show': { w: 180, h: 270, r: x2 },
    'listing-media': { w: 710, h: 475, r: x2 },
    'issue-promo': {w: 183, h: 235, r: x2},
    'homepage-top-lede-section': { w: 620, h: 620, r:x2 },
    'img-gal-mobile-grid-lg': { w: 384, h: 577, r: x2 },
    'img-gal-mobile-grid-sm': { w: 384, h: 384, r: x2 },
    'img-gal-tablet-grid-lg': { w: 590, h: 886, r: x2 },
    'img-gal-tablet-grid-sm': { w: 590, h: 590, r: x2 },
    'img-gal-desktop-grid-lg': { w: 300, h: 450, r: x2 },
    'img-gal-desktop-grid-sm': { w: 300, h: 300, r: x2 },
    'img-gal-mobile-list-vertical': { w: 768, h: 1154, r: x2 },
    'img-gal-mobile-list-square': { w: 768, h: 768, r: x2 },
    'img-gal-desktop-list-vertical': { w: 450, h: 676, r: x2 },
    'img-gal-desktop-list-horizontal': { w: 807, h: 539, r: x2 },
    'content-feed-article-small-small':{ w: 135, h: 95, r: x2 },
    'content-feed-article-small-medium':{ w: 180, h: 108, r: x2 },
    'content-feed-article-small-large':{ w: 120, h: 120, r: x2 },
    'content-feed-article-medium-small':{ w: 135, h: 95, r: x2 },
    'content-feed-article-medium-medium':{ w: 180, h: 108, r: x2 },
    'content-feed-article-medium-large':{ w: 233, h: 140, r: x2 },
    'content-feed-article-large-small':{ w: 135, h: 95, r: x2 },
    'content-feed-article-large-medium':{ w: 180, h: 108, r: x2 },
    'content-feed-article-large-large':{ w: 333, h: 200, r: x2 },
    'content-feed-article-lede-small':{ w: 712, h: 474, r: x2 },
    'content-feed-article-lede-medium':{ w: 830, h: 553, r: x2 },
    'content-feed-article-lede-large':{ w: 535, h: 356, r: x2 }
  },
  variableRenditions = [
    // note: there will be more of these when we add slideshow renditions
    'flex',
    'flex-large',
    'flex-small',
    'flex-xxsmall',
    'flex-medium-small',
    'flex-medium',
    'flex-medium-large',
    'flex-xlarge',
    'vertical-small-variable'
  ],
  originalRenditions = ['original', 'full-bleed'],
  defaultRendition = renditions.horizontal,
  unit = 'px';

/**
 * format the width, height, and pixel-depth for media play URL
 * @param {{w: number, h: number, r: string}} dimensions
 * @returns {string}
 */
function addDimensions(dimensions) {
  if (dimensions.r === '2x') {
    return '.w' + dimensions.w + '.h' + dimensions.h + '.' + dimensions.r;
  } else {
    return '.w' + dimensions.w + '.h' + dimensions.h;
  }
}

/**
 * format the crop status for media play URL (defaults to true)
 * @param {boolean} crop
 * @returns {string}
 */
function addCrop(crop) {
  if (crop === false) {
    // if crop is EXPLICITLY false
    return '.nocrop';
  } else {
    // if crop is undefined, or true
    return '';
  }
}

/**
 * Remove width, height, cropping, and resolution from media-play url.
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(url) {
  return url
    .replace('http://', 'https://')
    .replace(/\.w\d+/i, '')   // remove width
    .replace(/\.h\d+/i, '')   // remove height
    .replace(/\.\dx/, '')     // remove dimensions
    .replace(/\.nocrop/, ''); // remove cropping
}

/**
 * Get the file extension from full URL.
 * @param {string} url
 * @returns {string}
 */
function getExt(url) {
  return '.' + url.split('.').pop();
}

/**
 * Get the file name from full URL.
 * @param {string} url
 * @returns {string}
 */
function getInitial(url) {
  return _initial(cleanUrl(url).split('.')).join('.');
}

/**
 * Get the file name from full URL.
 * @param {string} url
 * @param {{w: number, h: number}} dimensions
 * @param {boolean} crop
 * @returns {string}
 */
function getRenditionUrl(url, dimensions, crop) {
  if (!dimensions || !dimensions.w || !dimensions.h) {
    if (dimensions && dimensions.w && !dimensions.h && !crop) {
      // If we have everything but height and aren't cropping, set to max height
      dimensions.h = MAX_HEADROOM;
    } else {
      throw new Error('Dimensions required for media play.');
    }
  }

  return getInitial(url) + addCrop(crop) + addDimensions(dimensions) + getExt(url);
}

function isMediaPlay(url) {
  return _includes(url,'pixel') || _includes(url, 'mediaplay');
}

function isInvalidUrl(url) {
  return !_isString(url) || !url.length;
}

/**
 * get a url for a named rendition
 * @param {string} url
 * @param {string} [renditionName=defaultRendition]
 * @returns {string}
 */
function getRendition(url, renditionName) {
  if (isInvalidUrl(url) || !isMediaPlay(url) ) {
    return '';
  } else if (!renditionName) {
    // default to horizontal rendition
    return getRenditionUrl(url, defaultRendition);
  } else if (_includes(originalRenditions, renditionName)) {
    // get the original url without any dimensions
    return cleanUrl(url);
  } else if (_includes(variableRenditions, renditionName)) {
    // get rendition, and DO NOT crop
    return getRenditionUrl(url, renditions[renditionName], false);
  } else if (renditions[renditionName]) {
    // get named rendition
    return getRenditionUrl(url, renditions[renditionName]);
  } else {
    // if they ask for a rendition that doesn't exist, fail hard
    throw new Error('No dimensions found for rendition "' + renditionName + '"');
  }
}

/**
 * get a url for an unnamed rendition by passing in the required dimensions
 * @param {string} url
 * @param {number} width
 * @param {number} height
 * @param {boolean} doubleDensity
 * @returns {string}
 */
function getDynamicRendition(url, width, height, doubleDensity) {
  if (isInvalidUrl(url) || !isMediaPlay(url) ) {
    return '';
  }

  if (isNaN(parseInt(width, 10)) || isNaN(parseInt(height, 10))) {
    return '';
  }

  return getRenditionUrl(url, { w: parseInt(width, 10), h: parseInt(height, 10), r: doubleDensity ? x2 : x1 });
}

/**
 *  get a url that keeps 'nocrop' in string if
 * present in origianl URL and zoomActive is true
 * defaults to original img url for older images
 * @param {string} url
 * @param {string} [renditionName=defaultRendition]
 * @param {Boolean} zoomActive should be used only for zoom renditions
 * @returns {string}
 */
function getRenditionZoom(url, renditionName, zoomActive) {
  var endRes  = getRendition(url, renditionName),
    testPttrn = /nocrop\.w[0-9]+\.h/i,
    wdthPttrn = /\.w[0-9]+\.h/;

  if (zoomActive && testPttrn.test(url) && !testPttrn.test(endRes)) {
    endRes = endRes.replace(wdthPttrn, '.nocrop$&');
  }
  return endRes || url;
}

/**
 * @param {string} renditionName
 * @param {number} [adjustment=0]
 * @returns {string}
 */
function getRenditionWidth(renditionName, adjustment) {
  adjustment = _isNumber(adjustment) && parseFloat(adjustment) || 0;

  if (!renditionName) {
    return defaultRendition.w + adjustment + unit;
  } else if (_includes(originalRenditions, renditionName)) {
    return '';
  } else if (_includes(variableRenditions, renditionName)) {
    throw new Error('We currently do not support variable height images.');
  } else if (renditions[renditionName]) {
    // get named rendition
    return renditions[renditionName].w + adjustment + unit;
  } else {
    // if they ask for a rendition that doesn't exist, fail hard
    throw new Error('No dimensions found for rendition "' + renditionName + '"');
  }
}

/**
 * @param {string} renditionName
 * @param {number} [adjustment=0]
 * @returns {string}
 */
function getRenditionHeight(renditionName, adjustment) {
  adjustment = _isNumber(adjustment) && parseFloat(adjustment) || 0;

  if (!renditionName) {
    return defaultRendition.h + adjustment + unit;
  } else if (_includes(originalRenditions, renditionName)) {
    return '';
  } else if (_includes(variableRenditions, renditionName)) {
    throw new Error('We currently do not support variable height images.');
  } else if (renditions[renditionName]) {
    // get named rendition
    return renditions[renditionName].h + adjustment + unit;
  } else {
    // if they ask for a rendition that doesn't exist, fail hard
    throw new Error('No dimensions found for rendition "' + renditionName + '"');
  }
}

/**
 * transform a mediaplay url into a path we can call the api with
 * note: this is the same as the `mediaplayUrl` transform in magic-button
 * @param {string} url
 * @returns {string}
 */
function getImgPath(url) {
  const path = url.replace(/^.*?imgs\//, ''); // remove domain and everything up to imgs/

  // remove rendition stuff
  let barePath = path.replace(/\.w\d+/, ''); // remove width

  barePath = barePath.replace(/\.h\d+/, ''); // remove height
  barePath = barePath.replace('.2x', ''); // remove resolution
  barePath = barePath.replace('.nocrop', ''); // remove cropping

  return barePath;
}

/**
 * generate clay credit from mediaplay credit, credit url, and copyright/source
 * @param {string} credit
 * @param {string} creditUrl
 * @param {string} source
 * @returns {string}
 */
function generateCredit(credit, creditUrl, source) {
  var finalCredit = '';

  // figure out credit + source
  if (credit && source) {
    // first, trim the source off of the credit, in case it was manually added there
    // this prevents double-sources
    finalCredit = credit.replace(`/${source}`, '');
    // then, append the source to the credit
    finalCredit += `/${source}`;
  } else if (credit) {
    finalCredit = credit;
  } else if (source) {
    // we almost never have a situation with just the source,
    // but we should handle this scenario just in case
    finalCredit = source;
  }

  // figure out credit url
  if (finalCredit && creditUrl) {
    // wrap the whole credit+source in a link
    finalCredit = `<a href="${creditUrl}" target="_blank" title="${finalCredit}">${finalCredit}</a>`;
  }

  return finalCredit;
}

/**
 * get the credit for a mediaplay image, from the image url
 * @param {string} url
 * @returns {Promise}
 */
function getMediaplayMetadata(url) {
  var metadata = {},
    metaCredit,
    metaCreditUrl,
    metaSource;

  metadata.imageType = '';
  metadata.credit = '';

  if (!isInvalidUrl(url)) {
    return rest.get(process.env.AMBROSE_HOST + '/content/assets/images/' + getImgPath(url))
      .then(function (res) {
        metaCredit = _get(res, 'metadata.credit') || '';
        metaCreditUrl = _get(res, 'metadata.creditUrl') || '';
        metaSource = _get(res, 'metadata.copyright') || '';
        metadata.imageType = _get(res, 'metadata.photoType') || '';
        metadata.credit = generateCredit(metaCredit, metaCreditUrl, metaSource);
        metadata.dimensions = res.dimension || {};
        return metadata;
      })
      .catch(() => metadata);
  } else {
    return Promise.resolve(metadata);
  }
}

/**
 * get the credit for a mediaplay image, from the image url
 * @param {string} url
 * @returns {Promise}
 */
function getRawMetadata(url) {
  if (!isInvalidUrl(url)) {
    return rest.get(process.env.AMBROSE_HOST + '/content/assets/images/' + getImgPath(url))
      .then(function (resp) {
        return resp.metadata;
      })
      .catch(() => ({}));
  } else {
    return Promise.resolve({});
  }
}

/**
 * getRenditionWithoutPixelDensity
 *
 * because of the way code works, its much easier to remove the 2x from the url string than it is to add it (in the right place).
 * Hence we remove the resolution from a rendition for non-retina versions of an image with the same dimensions
 *
 * @param {String} url mediaplay image with resolution
 * @returns {String} url rendition url without resolution
 */
function getRenditionWithoutPixelDensity(url) {
  return url.replace(/\.\dx/, '');
}


/**
 * Get the rendition aspect ratio; useful if fitting within constrained space
 * @param {string} [renditionName=defaultRendition]
 * @returns {number}
 */
function getRenditionAspectRatio(renditionName) {
  const rendition = renditions[renditionName] || defaultRendition;

  return Math.round(rendition.w / rendition.h * 100) / 100;
}

/**
 * Gets silo image url rendition based on a rendition name
 * @param {string} url
 * @param {string} renditionName
 * @returns {string}
 */
function getSiloImageRendition(url, renditionName) {
  let siloImageUrl = '';

  if (isInvalidUrl(url) || !isMediaPlay(url)) {
    return siloImageUrl;
  }

  siloImageUrl = cleanUrl(url).replace(getExt(url), '-silo.png');

  return getRendition(siloImageUrl, renditionName);
}


// for use by components, the `rendition` filter, and any services that need it
module.exports.isMediaPlay = isMediaPlay;
module.exports.getMediaplayMetadata = getMediaplayMetadata;
module.exports.getRawMetadata = getRawMetadata;
module.exports.getRendition = getRendition;
module.exports.getRenditionAspectRatio = getRenditionAspectRatio;
module.exports.getRenditionWidth = getRenditionWidth;
module.exports.getRenditionHeight = getRenditionHeight;
module.exports.getRenditionZoom = getRenditionZoom;
module.exports.getRenditionWithoutPixelDensity = getRenditionWithoutPixelDensity;
module.exports.getSiloImageRendition = getSiloImageRendition;
module.exports.getDynamicRendition = getDynamicRendition;

// for testing
module.exports.cleanUrl = cleanUrl;
module.exports.getRenditionUrl = getRenditionUrl;

// for testing and referencing renditions in other internal modules
module.exports.renditions = renditions;
module.exports.variableRenditions = variableRenditions;
module.exports.originalRenditions = originalRenditions;
