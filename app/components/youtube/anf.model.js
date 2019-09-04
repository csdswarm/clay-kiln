'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/embedwebvideo
*/

module.exports = function (ref, data, locals) {
  return {
    role: 'embedvideo',
    URL: `https://www.youtube.com/embed/${ data.contentId }`,
    layout: 'youtubeLayout',
    style: 'youtubeStyle',
    format: 'html'
  };
};
