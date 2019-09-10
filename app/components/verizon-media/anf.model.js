'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/video
*/
const rest = require('../../services/universal/rest'),
  _get = require('lodash/get'),
  log = require('../universal/log').setup({ file: __filename }),
  vidibleApi = `http://api.vidible.tv/${ process.env.VIDIBLE_KEY }/`,
  getVideoRendition = async videoID => {
    let srcURL = '';

    try {
      const video = await rest.get(`${ vidibleApi }video/${ videoID }?show_metadata=false&show_transcript=false&show_thumbnails=false`, {});

      srcURL = _get(video, originalVideoUrl);
    } catch (e) {
      log('error', `Error fetching data from verizon api for video ID ${ videoID }: ${ e }`);
    };

    return srcURL;
  };

module.exports = function async (ref, data) {
  return {
    role: 'video',
    URL: await getVideoRendition(data.videoId) || '',
    layout: 'vidibleLayout',
    style: 'vidibleStyle',
    format: 'html'
  };
};
