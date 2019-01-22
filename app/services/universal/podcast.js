'use strict';

/**
 * returns a url for a podcast based on the title
 * @param {string} title
 * @returns {string}
 */
module.exports.createUrl = (title) => {
  // remove common words and special characters
  // test here: https://gist.github.com/sbryant31/b316df0a9e7d9446b8871ca688405a15
  const processedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9- ]+/g, '')
    .replace(/\b(\a|an|as|at|before|but|by|for|from|is|in|into|like|of|off|on|onto|per|since|than|the|this|that|to|up|via|with)\b /gi, '')
    .replace(/ +/g, '-')
    .replace(/-+/g, '-');

  return `https://www.radio.com/media/podcast/${processedTitle}`;
};

/**
 * returns a small image url for a podcast
 * @param {string} image
 * @returns {string}
 */
module.exports.createImageUrl = (image) => image.toLowerCase().replace(/size=medium/i, 'size=small');
