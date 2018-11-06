'use strict';

/**
 * Determine embed style from clip URL's params
 * @param {object} data
 */
function setEmbedSize(data) {
  if (data.clipURL) {
    if (data.clipURL.split('style=')[1].indexOf('artwork') !== -1) {
      data.embedSize = 'wide-simple';
    } else if (data.clipURL.split('style=')[1].indexOf('cover') !== -1) {
      if (data.clipURL.indexOf('size=square') !== -1) {
        data.embedSize = 'square';
      } else {
        data.embedSize = 'wide-image';
      }
    } else {
      data.embedSize = 'default';
    }
  }
  return data;
}

/**
 * Strip clip URL of anything other than show and clip title
 * @param {object} data
 */
function trimClipURL(data) {
  data.clipURL = data.clipURL ? data.clipURL.split('/embed')[0].split('?')[0] : '';
  return data;
}

module.exports.save = (uri, data, locals) => {
  setEmbedSize(data);
  trimClipURL(data);
  return data;
};
