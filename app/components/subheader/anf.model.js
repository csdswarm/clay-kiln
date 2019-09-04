'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/heading
*/

module.exports = function (ref, data, locals) {
  return {
    role: 'heading2',
    text: data.text,
    layout: 'subheaderLayout',
    style: 'subheaderStyle',
    textStyle: 'subheaderTextStyle',
    format: 'html'
  };
};
