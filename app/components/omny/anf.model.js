'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/

const rest = require('../../services/universal/rest');

module.exports = async function (ref, data) {
  const { ImageUrl: imageURL } = await rest.get(`${data.clipSrc}.json`);

  return {
    role: 'audio',
    URL: `${ data.clipSrc }.mp3`,
    ...imageURL ? { imageURL } : {},
    layout: 'bodyItemLayout'
  };
};
