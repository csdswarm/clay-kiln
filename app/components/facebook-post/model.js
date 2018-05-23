'use strict';

const rest = require('../../services/universal/rest'),
  utils = require('../../services/universal/utils'),
  FACEBOOK_ENDPOINT = 'https://www.facebook.com/plugins/post/oembed.json';

function getRequestUrl(data) {
  return `${FACEBOOK_ENDPOINT}?url=${encodeURI(data.url)}&omitscript=true`;
}

module.exports.save = (uri, data) => {
  if (utils.isFieldEmpty(data.url)) {
    delete data.html;

    return data;
  }

  // first, wrangle the url
  data.url = data.url.match(/(https?:\/\/www\.facebook\.com\/.+)/)[1];

  // note: we're using the un-authenticated api endpoint. don't abuse this
  return rest.getJSONP(getRequestUrl(data))
    .then((res) => {
      // if facebook gives us an error, throw it
      if (!res.success) {
        throw new Error(`Facebook oembed api error for ${data.url}`);
      }
      // store facebook oembed html
      data.html = res.html;
      // update component instance with new html
      return data;
    })
    .catch((e) => {
      if (utils.isFieldEmpty(data.html)) {
        // if we've never grabbed html for this post and we can't fetch it from the api, throw an error
        throw new Error(`Cannot embed facebook post: ${e.message}`);
      } else {
        // we have html for this, so it means the post has most likely been deleted (or the privacy settings have changed). display it with the fallback styles
        return data;
      }
    });
};
