'use strict';

const mediaplay = require('./media-play'),
  noRes = mediaplay.getRenditionWithoutPixelDensity;

/**
 * Removes whitespace from specified string.
 * @param {string} str
 * @return {string}
 **/
function removeWhitespace(str) {
  return str.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
}

/**
 * A handlebars helper for embedding an image whose rendition varies across
 * viewports. Unlike srcset, allows you to use images with varying aspect ratios.
 * Returns a <div> along with some style rules that give the <div> the correct
 * background and size it according to its rendition dimensions. This element
 * behaves much like a regular <img> element -- it shrinks to fit available
 * space while automatically preserving aspect ratio.
 * @param {Object} obj A dynamic image object
 * @param {string} obj.url mediaplay URL for image
 * @param {string} obj.mobile rendition name for mobile
 * @param {string} obj.tablet rendition name for tablet
 * @param {string} obj.desktop rendition name for desktop
 * @param {Boolean} obj.zoom should the zoom rendition be used
 * @param {string} opts.className class to use as img tag
 * @param {string} obj.origSrc img url to use as img src
 * @param {string} obj.origSrcSet img urls to use as img srcset
 * @param {string} obj.alt to use as img alt tag
 * @param {string} obj.origMeta all additional meta information required by image tag
 * @param {Object} context handlebars context
 * @param {Object} [context.hash] named options passed into helper from template
 * @param {string} [context.hash.breakpoints] set to "home" to set wider breakpoints
 * @param {Boolean} [context.hash.lazy] should images lazy-load
 * @return {string}
 **/
function dynamicImage(obj, context) {
  var imgString, lazyPrefixSrc;
  const opts = context && context.hash,
    homeBreakpoints = opts && opts.breakpoints === 'home',
    tabletBreakpoint = homeBreakpoints ? '768px' : '600px',
    desktopBreakpoint = homeBreakpoints ? '1180px' : '1024px',
    mobileUrl = mediaplay.getRenditionZoom(obj.url, obj.mobile, obj.zoom),
    tabletUrl = mediaplay.getRenditionZoom(obj.url, obj.tablet, obj.zoom),
    desktopUrl = mediaplay.getRenditionZoom(obj.url, obj.desktop, obj.zoom),
    alt = obj.alt ? obj.alt : '';

  if (obj.zoom && obj.origSrcSet && obj.origSrc && obj.origMeta) {
    imgString = ` <img class="${opts.className}" srcset="${obj.origSrcSet}" src="${obj.origSrc}" alt="${alt}" ${obj.origMeta}>`;
    lazyPrefixSrc =  'data-srcset';
  } else {
    lazyPrefixSrc = opts.lazy ? 'data-srcset' : 'srcset';
    imgString = `<img src="${opts.lazy ? '' : noRes(mobileUrl)}" class="${opts.className}" data-src="${noRes(mobileUrl)}"/>`;
  }

  return removeWhitespace(`
    <picture>
      <source media="(min-resolution: 192dpi) and (min-width: ${desktopBreakpoint}), (-webkit-min-device-pixel-ratio: 2) and (min-width: ${desktopBreakpoint})" ${lazyPrefixSrc}="${desktopUrl} 2x"/>
      <source media="(min-width: ${desktopBreakpoint})" ${lazyPrefixSrc}="${noRes(desktopUrl)}"/>
      <source media="(min-resolution: 192dpi) and (min-width: ${tabletBreakpoint}), (-webkit-min-device-pixel-ratio: 2) and (min-width: ${tabletBreakpoint})" ${lazyPrefixSrc}="${tabletUrl} 2x"/>
      <source media="(min-width: ${tabletBreakpoint})" ${lazyPrefixSrc}="${noRes(tabletUrl)}"/>
      <source media="(min-resolution: 192dpi), (-webkit-min-device-pixel-ratio: 2)" ${lazyPrefixSrc}="${mobileUrl}"/>
      ${imgString}
    </picture>
  `);
}

module.exports = dynamicImage;
