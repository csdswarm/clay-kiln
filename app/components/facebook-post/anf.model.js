'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/facebookpost
*/

module.exports = function (ref, data) {
  return {
    role: 'facebook_post',
    URL: data.url,
    layout: 'facebookPostLayout',
    style: 'facebookPostStyle',
    format: 'html'
  };
};
