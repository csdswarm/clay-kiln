'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/instagram
*/

module.exports = function (ref, data) {
  return {
    role: 'instagram',
    URL: data.showCaption ? data.url : `${ data.url }&hidecaption=true`,
    layout: 'bodyItemLayout'
  };
};
