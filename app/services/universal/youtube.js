'use strict';

const rest = require('./rest'),
  querystring = require('query-string'),
  _get = require('lodash/get'),
  moment = require('moment'),
  YT_API = 'https://www.googleapis.com/youtube/v3',
  log = require('./log').setup({ file: __filename });


function getDurationInSeconds(duration) {
  return moment.duration(duration, moment.ISO_8601).asSeconds();
}

/**
 * Retrieve details for video or playlist from youtube api
 * @param {string} contentId The videoId or playlist to get the details for
 * @param {boolean} isPlaylist If true, youtube will query the contentId against play lists instead of videos
 * @returns {Promise<object>} a data object containing the content details.
 */
function getVideoDetails(contentId, isPlaylist = false) {
  const videoSearchUrl = `${YT_API}/${isPlaylist ? 'playlists' : 'videos' }`,
    qs = querystring.stringify({
      part: 'snippet,contentDetails',
      id: contentId,
      key: process.env.YOUTUBE_API_KEY
    });

  return rest.get(`${videoSearchUrl}?${qs}`)
    .then(res => Object.assign(
      _get(res, 'items[0].snippet', {}),
      { duration: getDurationInSeconds(_get(res, 'items[0].contentDetails.duration', 0)) }
    ))
    .catch(err =>
      log('error', `Error fetching details for video or playlist with id ${contentId}: ${err.stack}`)
    );
}

module.exports.getVideoDetails = getVideoDetails;
