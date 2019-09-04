'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/tweet
*/

const getTweetURL = data => {
  if (data.showMedia && data.showThread) {
    return data.url;
  }

  const url = `${ data.url }?`;

  if (!data.showMedia && !data.showThread) {
    url.concat('hide_media=true&hide_thread=true');
  } else {
    if (!data.showMedia) url.concat('hide_media=true');
    if (!data.showThread) url.concat('hide_thread=true');
  }

  return url;
}

module.exports = function (ref, data, locals) {
  return {
    role: 'tweet',
    URL: getTweetURL(data),
    layout: 'tweetLayout',
    style: 'tweetStyle',
    format: 'html'
  };
};
