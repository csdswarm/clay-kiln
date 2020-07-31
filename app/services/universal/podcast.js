'use strict';

const _isEmpty = require('lodash/isEmpty'),
  querystring = require('query-string'),
  radioApiService = require('../server/radioApi'),
  urlParse = require('url-parse'),
  __ = {
    radioApiService,
    _isEmpty
  };

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
module.exports.createImageUrl = image => {
  const baseImage = urlParse(image, true),
    parsedParams = baseImage.query;
    
  parsedParams['size'] = 'small';
  // eslint-disable-next-line one-var
  const stringParams = querystring.stringify(parsedParams);

  return `${baseImage.origin}${baseImage.pathname}?${stringParams}&`;
};

/**
* fetch podcast episode data
* @param {object} locals
* @param {string} dynamicSlug
* @returns {Promise<object>}
*/
module.exports.getPodcastShow = async (locals, dynamicSlug) => {
  console.log('getPodcastShow');
  const route = `podcasts?filter[site_slug]=${ dynamicSlug }`,
    { data } = await __.radioApiService.get(route, {}, null, {}, locals);
  
  if (__._isEmpty(data)) {
    return {};
  }
  
  return data[0];
};

/**
* fetch podcast show data
* @param {object} locals
* @param {string} dynamicEpisode
* @returns {Promise<object>}
*/
module.exports.getPodcastEpisode = async (locals, dynamicEpisode) => {
  const route = `episodes?filter[episode_site_slug]=${ dynamicEpisode }`,
    { data } = await __.radioApiService.get(route, {}, null, {}, locals);

  if (__._isEmpty(data)) {
    return {};
  }

  return data[0];
};

module.exports._internals = __;
