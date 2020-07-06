'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/heading
*/

module.exports = function (ref, data) {
  return {
    role: 'heading2',
    text: data.text,
    format: 'html'
  };
};
