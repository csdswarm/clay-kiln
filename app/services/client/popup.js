'use strict';

const $window = window;

/**
 * returns an object of new window options
 * @param {{ url: String, name: String }} opts - Object containing
 * @param {Object} dimensions - An object of new window options, including dimensions & position
 * @returns {Object}
 */
function params(opts, dimensions) {
  var address, name, features;

  if (opts.url) {
    address = opts.url;
  }

  if (opts.name) {
    name = opts.name;
  }

  features = 'width=' + (dimensions.w || 0) + ',height=' + (dimensions.h || 0) + ',top=' + (dimensions.top || 0) + ',left=' + (dimensions.left || 0);

  return { address, name, features };
};

/**
 * returns an object of screen dimensions
 * @returns {{ dualScreenLeft: Number, dualScreenTop: Number, width: Number, height: Number }}
 */
function getScreenDimensions() {
  var usesScreenForDimensions = $window.hasOwnProperty('screen') && $window.screen.hasOwnProperty('screenTop'),
    dualScreenLeft,
    dualScreenTop;

  if (usesScreenForDimensions) {
    dualScreenLeft = $window.screen.left;
    dualScreenTop = $window.screen.top;
  } else {
    dualScreenLeft = $window.screenLeft;
    dualScreenTop = $window.screenTop;
  }

  return {
    dualScreenLeft: dualScreenLeft || 0,
    dualScreenTop: dualScreenTop || 0,
    width: $window.innerWidth || $window.screen.width,
    height: $window.innerHeight || $window.screen.height
  };
};

/**
 * returns an object of numbers used for positioning a new window
 * @param {Number} newWidth - the current window's width
 * @param {Number} newHeight - the current window's height
 * @returns {Object}
 */
function position(newWidth, newHeight) {
  var dimensions = getScreenDimensions(),
    left = Math.floor(Math.max(dimensions.width / 2 - newWidth / 2 + dimensions.dualScreenLeft, 0)),
    top = Math.floor(Math.max(dimensions.height / 2 - newHeight / 2 + dimensions.dualScreenTop, 0));

  return { left, top };
};

module.exports.position = position;
module.exports.params = params;
