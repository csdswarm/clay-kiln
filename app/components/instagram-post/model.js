'use strict';

const rest = require('../../services/universal/rest'),
  instagramApiBaseUrl = 'https://api.instagram.com/oembed/?omitscript=true&url=',
  { unityComponent } = require('../../services/universal/amphora');

/**
 * Determine if an instagram post should hide its caption
 * @param {bool} showCaption
 * @returns {string}
 */
function hideCaption(showCaption) {
  return showCaption === false ? '&hidecaption=true' : '';
}

module.exports = unityComponent({
  save: async function (uri, data) {
    // reset html if no url is provided
    if (!data.url) {
      return {
        ...data,
        html: ''
      };
    }

    // note: we're using the un-authenticated api endpoint. don't abuse this
    const { showCaption, url } = data,
      result = await rest.get(instagramApiBaseUrl + encodeURI(url) + hideCaption(showCaption))
        .then(function (json) {
          return {
            html: json.html,
            invalid: false
          };
        })
        .catch(() => ({
          html: '',
          invalid: true
        }));

    return {
      ...data,
      ...result
    };
  }
});
