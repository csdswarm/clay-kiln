'use strict';

/**
 * Bug with Safari/iOS Mobile AJAX images
 *
 * @param  {String} string
 * @return {String}
 */
function fixAJAXImages(parentContainer) {
  // iOS doesn't play nice with srcset dynamically (https://github.com/metafizzy/infinite-scroll/issues/770)
  if (/iPhone|iPad|Safari/.test(navigator.userAgent)) {
    parentContainer.querySelectorAll('img').forEach((img) => {
      if (!img.height) {
        img.outerHTML = img.outerHTML;
      }
    });
  }
}

module.exports.fixAJAXImages = fixAJAXImages;
