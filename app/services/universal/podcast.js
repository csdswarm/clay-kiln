'use strict';

const urlParse = require('url-parse'),
  querystring = require('query-string');

/**
 * returns a url for a podcast based on the site_slug
 * @param {string} site_slug
 * @returns {string}
 */
module.exports.createUrl = (site_slug) => {
  return `https://www.radio.com/media/podcast/${site_slug}`;
};

/**
 * returns a small image url for a podcast
 * @param {string} image
 * @returns {string}
 */
module.exports.createImageUrl = image => {
  const baseImage = urlParse(image, true),
    parsedParams = baseImage.query;

  parsedParams['size'] = 'small';
  // eslint-disable-next-line one-var
  const stringParams = querystring.stringify(parsedParams);

  return `${baseImage.origin}${baseImage.pathname}?${stringParams}&`;
};
