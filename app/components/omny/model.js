'use strict';

/**
 * Strip clip URL of anything other than show and clip title
 * @param {string} URL
 */
function trimClipURL(data) {
  data.clipURL = data.clipURL ? data.clipURL.split('/embed')[0].split('?')[0] : '';
  return data;
}

module.exports.save = (uri, data, locals) => {
  trimClipURL(data);
  return data;
};
