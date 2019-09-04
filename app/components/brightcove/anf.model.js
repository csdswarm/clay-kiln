'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/embedwebvideo
*/

module.exports = function (ref, data, locals) {
  return {
    role: 'embedvideo', //test
    URL: data.seoEmbedUrl,
    layout: 'brightcoveLayout',
    style: 'brightcoveStyle',
    format: 'html'
  };
};
