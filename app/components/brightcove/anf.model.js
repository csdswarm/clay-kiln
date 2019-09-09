'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/

module.exports = function (ref, data) {
  return {
    role: 'video',
    URL: data.video.m3u8Source || '',
    layout: 'brightcoveLayout',
    style: 'brightcoveStyle',
    format: 'html'
  };
};
