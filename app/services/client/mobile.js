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

/**
 * Check if the browser width is mobile
 *
 * @param  {String} string
 * @return {String}
 */
function isMobileNavWidth() {
  return (window.innerWidth || document.documentElement.clientWidth) <= 1023;
}

module.exports.isMobileWidth = isMobileWidth;
module.exports.isMobileNavWidth = isMobileNavWidth;
