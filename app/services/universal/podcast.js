'use strict';

const urlParse = require('url-parse'),
  querystring = require('query-string');

/**
 * returns a url for a podcast based on the site_slug
 * @param {string} podcast_slug The podcast's site_slug
 * @param {string} [station_slug] The site_slug of the station the podcast belongs to
 * @returns {string}
 */
module.exports.createUrl = (podcast_slug,station_slug) => {
  let url = '/';

  if (station_slug) {
    url += station_slug + '/';
  }

  url += 'podcast/';

  if (podcast_slug) {
    url += podcast_slug + '/';
  }

  return url;
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
