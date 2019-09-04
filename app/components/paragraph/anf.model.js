'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/body
*/

module.exports = function (ref, data, locals) {
  return {
    role: 'body',
    text: data.text,
    layout: 'paragraphLayout',
    style: 'paragraphStyle',
    textStyle: 'paragraphTextStyle',
    format: 'html'
  };
};
