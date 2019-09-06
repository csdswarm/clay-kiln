'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/

module.exports = function (ref, data, locals) {
  return {
    role: 'video', // test
    URL: '', // .M3U8
    layout: 'omnyLayout',
    style: 'omnyStyle',
    format: 'html'
  };
};
