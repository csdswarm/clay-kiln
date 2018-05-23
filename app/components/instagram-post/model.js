'use strict';

const rest = require('../../services/universal/rest'),
  instagramApiBaseUrl = 'https://api.instagram.com/oembed/?omitscript=true&url=';

/**
 * Determine if an instagram post should hide its caption
 * @param {object} data
 * @returns {string}
 */
function hideCaption(data) {
  return data.showCaption === false ? '&hidecaption=true' : '';
}

module.exports.save = function (uri, data) {
  if (data.url) {
    // note: we're using the un-authenticated api endpoint. don't abuse this
    return rest.getJSONP(instagramApiBaseUrl + encodeURI(data.url) + hideCaption(data))
      .then(function (json) {
        // get instagram oembed html
        data.html = json.html;

        return data;
      })
      .catch(() => data); // fail gracefully
  } else {
    data.html = ''; // clear the html if there's no url

    return data;
  }
};
