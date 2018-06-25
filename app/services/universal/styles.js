'use strict';
var postcss = require('postcss'),
  nested = require('postcss-nested'),
  safe = require('postcss-safe-parser'),
  csso = require('postcss-csso');

/**
 * render scoped css using postcss
 * @param {string} uri
 * @param {string} styles
 * @returns {string}
 */
function render(uri, styles) {
  var wrapped = `[data-uri="${uri}"] {
      ${styles}
    }`;

  return postcss([nested, csso]).process(wrapped, { parser: safe }).then(function (result) {
    return result.css;
  });
}

module.exports.render = render;
