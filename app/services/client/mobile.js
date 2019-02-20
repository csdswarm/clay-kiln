'use strict';

/**
 * Check if the browser width is mobile
 *
 * @param  {String} string
 * @return {String}
 */
function isMobileWidth() {
  return (window.innerWidth || document.documentElement.clientWidth) <= 480;
}

module.exports.isMobileWidth = isMobileWidth;
