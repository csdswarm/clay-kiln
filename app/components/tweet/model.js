'use strict';

const _get = require('lodash/get'),
  rest = require('../../services/universal/rest'),
  utils = require('../../services/universal/utils'),
  TWITTER_ENDPOINT = 'https://api.twitter.com/1/statuses/oembed.json';

function getRequestUrl(data) {
  const hideMedia = data.showMedia === false ? '&hide_media=true' : '',
    hideThread = data.showThread === false ? '&hide_thread=true' : '';

  console.log("got request url")
  return TWITTER_ENDPOINT + `?url=${encodeURI(data.url)}&omit_script=true${hideThread}${hideMedia}`;
}

module.exports.save = async (ref, data) => {

  console.log('save 1')
  if (utils.isFieldEmpty(data.url)) {
    delete data.html;
    return data;
  }

  console.log('save 2')
  // first, wrangle the url
  data.url = data.url.match(/(https?:\/\/twitter\.com\/\w+?\/status\/\d+)\/?/)[1];

  try {
    // note: we're using the un-authenticated api endpoint. don't abuse this
    const res = await rest.getJSONP(getRequestUrl(data))
    console.log('save 3')
    if (_get(res, 'errors.length')) {
      console.log('error', res.errors)
      data.error = true;
      data.html = '';
      return data;
    }
    // store tweet oembed html
    data.html = res.html;
    // update component instance with new html
    return data;
  } catch(e) {
    console.log('error2', e)
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
