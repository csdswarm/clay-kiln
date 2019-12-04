'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/image
*/

module.exports = function (ref, data) {
  return {
    role: 'image',
    URL: data.url,
    caption: data.caption,
    layout: 'imageLayout',
    style: 'imageStyle',
    textStyle: 'imageTextStyle',
    format: 'html'
  };
};
