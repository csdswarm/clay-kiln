'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/

const rest = require('../../services/universal/rest');

module.exports = async function (ref, data) {
  const { ImageUrl: imageURL } = await rest.get(`${data.clipSrc}.json`);

  // console.log('[OMNY metadata]', metadata);

  return {
    role: 'audio',
    URL: `${ data.clipSrc }.mp3`,
    imageURL,
    layout: 'bodyItemLayout',
    format: 'html'
  };
};
