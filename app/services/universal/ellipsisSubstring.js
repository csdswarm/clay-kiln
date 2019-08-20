'use strict';

/**
 * ellipsisSubstring - Return a substring of the input text with an ellipsis if it was truncated
 *
 * @param {String} text the string
 * @param {Number} start where to start
 * @param {Number} end where to end the string
 * @returns {String} substring of input text
 */
function ellipsisSubstring(text, start, end) {
  const substring = text.substring(start, end);

  if (text.length > substring.length) {
    return `${substring}…`;
  }

  return text;
}

module.exports = ellipsisSubstring;
