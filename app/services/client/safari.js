'use strict';

/**
 * Bug with Safari/iOS Mobile AJAX images, reset image HTML after it's been loaded
 *
 * @function
 * @param  {String} parentContainer
 */
function fixAJAXImages(parentContainer) {
  // iOS doesn't play nice with srcset dynamically (https://github.com/metafizzy/infinite-scroll/issues/770)
  // give the DOM time to settle before making it reparse. without this, some images may still not load
  setTimeout(() => {
    if (/iPhone|iPad/.test(navigator.userAgent)) {
      parentContainer.querySelectorAll('img').forEach((img) => {
        if (!img.height) {
          img.outerHTML = img.outerHTML;
        }
      });
    }
  }, 0);
}

module.exports.fixAJAXImages = fixAJAXImages;
