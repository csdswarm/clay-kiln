'use strict';

const _get = require('lodash/get'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'giphy'
  }),
  rest = require('../../services/universal/rest'),
  GIPHY_KEY = process.env.GIPHY_KEY,
  GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs/',
  URL_PATTERN = /(?:https?:)?(?:\/\/)?(?:media)?\.?giphy\.com\/(embed|media|gifs)\/([\w\-]+)(?:\/[\w.\-]+)?/;

/**
 * Get giphy Id
 *
 * @param {string} url - giphy full url
 * @return {string} giphy id
 */
function getIdFromURLPattern(url) {
  let [,, id] = URL_PATTERN.exec(url) || [null, null, ''];

  if (id.includes('-')) {
    id = id.substring(id.lastIndexOf('-') + 1);
  }

  return id;
}

/**
 * Get giphy video and image url. API docs: https://developers.giphy.com/docs/#rendition-guide
 *
 * @param {Object} data - component data
 * @return {Promise}
 */
function getEmbedLinks(data) {
  const id = getIdFromURLPattern(data.url),
    request = `${GIPHY_ENDPOINT}${id}?api_key=${GIPHY_KEY}`;

  return rest.get(request)
    .then(function (jsonRes) {
      return  {
        author: _get(jsonRes, 'data.user.display_name') || '',
        imgLinkDesktop: _get(jsonRes, 'data.images.original_still.url') || '',
        videoLinkDesktop: _get(jsonRes, 'data.images.original.mp4') || '',
        imgLinkMobile: _get(jsonRes, 'data.images.fixed_height_still.url') || '',
        videoLinkMobile: _get(jsonRes, 'data.images.fixed_height.mp4') || ''
      };
    })
    .then(embedLinks => {
      data.author = embedLinks.author;
      data.imgLinkDesktop = embedLinks.imgLinkDesktop;
      data.videoLinkDesktop = embedLinks.videoLinkDesktop;
      data.imgLinkMobile = embedLinks.imgLinkMobile;
      data.videoLinkMobile = embedLinks.videoLinkMobile;

      return data;
    })
    .catch(error => {
      log(error);
      // Invalid if error
      data.giphyUrlValid = false;

      return data;
    });
}

module.exports.save = function (uri, data) {
  const dataURL = data.url || '';
  let url = '';

  // Assume valid at first
  data.giphyUrlValid = true;

  if (dataURL) {

    [url] = URL_PATTERN.exec(dataURL);
    data.url = url;

    return getEmbedLinks(data);
  } else {
    return data;
  }
};
