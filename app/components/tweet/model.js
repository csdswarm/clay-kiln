'use strict';

const _get = require('lodash/get'),
  rest = require('../../services/universal/rest'),
  utils = require('../../services/universal/utils'),
  TWITTER_ENDPOINT = 'https://api.twitter.com/1/statuses/oembed.json';

function getRequestUrl(data) {
  const hideMedia = data.showMedia === false ? '&hide_media=true' : '',
    hideThread = data.showThread === false ? '&hide_thread=true' : '';

  return TWITTER_ENDPOINT + `?url=${encodeURI(data.url)}&omit_script=true${hideThread}${hideMedia}`;
}

module.exports.save = async (ref, data) => {
  if (utils.isFieldEmpty(data.url)) {
    delete data.html;
    return data;
  }

  // first, wrangle the url
  data.url = data.url.match(/(https?:\/\/twitter\.com\/\w+?\/status\/\d+)\/?/)[1];

  try {
    // note: we're using the un-authenticated api endpoint. don't abuse this
    const res = await rest.getJSONP(getRequestUrl(data));

    if (_get(res, 'errors.length')) {
      data.error = true;
      data.html = '';
      return data;
    }
    // store tweet oembed html
    data.html = res.html;
    // update component instance with new html
    return data;
  } catch (e) {
    if (utils.isFieldEmpty(data.html)) {
      // if we've never grabbed html for this tweet and we can't fetch it from the api, throw an error
      data.error = true;
      data.html = '';
      return data;
    }
  }
  return data;
};

// for testing only
module.exports.getRequestUrl = getRequestUrl;
