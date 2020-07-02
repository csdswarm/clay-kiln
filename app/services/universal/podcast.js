'use strict';

const _get = require('lodash/get'),
  urlParse = require('url-parse'),
  querystring = require('query-string');


const getStationSlugById = (id, allStationsById) => {
  return _get(allStationsById, [id, 'site_slug']);
};

/**
 * returns a url for a podcast based on the site_slug
 * @param {string} podcast The podcast data (typically from Radio.com API)
 * @param {object} allStationsById An object of multiple stations data, where the key is a station's ID, and the value is that station's data - this is so that the createUrl function can remain a pure function
 * @returns {string}
 */
module.exports.createUrl = (podcast,allStationsById) => {
  const podcast_slug = _get(podcast,'attributes.site_slug'),
    stationId = _get(podcast,'attributes.station[0].id'),
    station_slug = getStationSlugById(stationId,allStationsById);

  return '/' + [
    station_slug,
    'podcast',
    podcast_slug
  ].filter(segment => segment).join('/');
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
