'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/

module.exports = function (ref, data) {
  return {
    role: 'audio',
    URL: `${ data.clipSrc }.mp3`,
    layout: 'videoLayout',
    style: 'omnyStyle',
    format: 'html'
  };
};
