'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/tweet
*/

const getTweetURL = data => {
  if (data.showMedia && data.showThread) {
    return data.url;
  }

  let url = `${ data.url }?`;

  if (!data.showMedia && !data.showThread) {
    url += 'hide_media=true&hide_thread=true';
  } else {
    if (!data.showMedia) {
      url += 'hide_media=true';
    }
    if (!data.showThread) {
      url += 'hide_thread=true';
    }
  }

  return url;
};

module.exports = function (ref, data) {
  return {
    role: 'tweet',
    URL: getTweetURL(data),
    layout: 'bodyItemLayout',
    format: 'html'
  };
};
