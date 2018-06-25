'use strict';
const purify = require('../../services/universal/purify'),
  utils = require('../../services/universal/utils');

/**
 * Return the first svg element in an html string
 * @param {string} content
 * @returns {string}
 */
function filterNonSVG(content) {
  const openingTag = content.match('<svg'),
    closingTag = content.match('</svg>');

  if (!openingTag) return '';
  return content.substring(openingTag.index, closingTag && closingTag.index + '</svg>'.length || content.length);
}

module.exports.save = (ref, data) => {
  if (utils.has(data.svgContent)) {
    data.svgContent = filterNonSVG(purify(data.svgContent.trim())); // remove any bad stuff first
  }

  return data;
};
