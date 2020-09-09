'use strict';
const _get = require('lodash/get'),
  _capitalize = require('lodash/capitalize'),
  db = require('../../services/server/db'),
  { getVideoDetails } = require('../../services/universal/youtube'),
  defaultPlayerBorderTopCTA = 'Watch',
  __ = {
    clearContentId,
    dbGet: db.get,
    getVideoDetails,
    setVideoDetails,
    updateSettingsByType
  };

/**
 * Override various settings by type of video
 * @param {object} data The data from the editor
 */
function updateSettingsByType(data) {
  data.videoType = _capitalize(data.videoType); // ooyala-player imported components will have this lowercased and therefore will mess up the styling, so capitalize them

  switch (data.videoType) {
    case 'Related':
      // By default, display borders and CTA when `related` type is first selected, afterwards accept user's selection
      data.playerBorderTopCTA = !data.previousTypeRelated && !data.playerBorderTopCTA ? defaultPlayerBorderTopCTA : data.playerBorderTopCTA;
      data.playerBorderTop = !data.previousTypeRelated ? true : data.playerBorderTop;
      data.playerBorderBottom = !data.previousTypeRelated ? true : data.playerBorderBottom;
      data.previousTypeRelated = true;
      break;
    case 'Sponsored':
      data.autoPlay = false;
      data.autoPlayNextVideo = false;
    default:
      // Toggle borders off if user previously selected `related` type. `sponsored` and `editorial` types share defaults
      data.playerBorderTop = data.previousTypeRelated ? false : data.playerBorderTop;
      data.playerBorderBottom = data.previousTypeRelated ? false : data.playerBorderBottom;
      data.previousTypeRelated = false;
  }
}

/**
 * Clears key data from the editor
 * @param {object} data data from the editor
 * @returns {*} the cleaned data object
 */
function clearContentId(data) {
  data.contentId = (data.contentId || '').split('&')[0];

  return data;
}

/**
 * sets the data to show in the player
 * @param {object} data The data from the editor
 * @param {object} videoDetails  The data from youtube
 * @returns {object} The modified data object
 */
function setVideoDetails(data, videoDetails) {
  if (!videoDetails.title) {
    data.videoValid = false;

    return data;
  }

  const maxResThumb = _get(videoDetails, 'thumbnails.maxres.url');

  Object.assign(data, {
    videoValid: true,
    channelName: videoDetails.channelTitle,
    videoTitle: videoDetails.title,
    // We know high res will be there, if maxRes is not available
    videoThumbnail: maxResThumb || _get(videoDetails, 'thumbnails.high.url')
  });

  if (videoDetails.duration) {
    data.videoDuration = videoDetails.duration;
  }

  return data;
}

/**
 * renders data for view with programmatic modifications
 * @param {string} ref This is not used
 * @param {object} data Used to update data in the view
 * @param {object=} locals This is not used
 * @returns {*} data
 */
const render = (ref, data) => {
    data.origSource = `https://www.youtube.com/${ data.isPlaylist ? 'playlist?list' : 'watch?v'}=${ data.contentId }`;
    return data;
  },

  /**
 * saves the changes from the editor
 * @param {string} uri This is not used
 * @param {object} data The data from the editor
 * @param {object=} locals This is not used
 * @returns {*}
 */
  save = async (uri, data, locals) => {
    const { clearContentId, dbGet, getVideoDetails, setVideoDetails, updateSettingsByType } = __;

    data.isPlaylist = data.videoSource === 'playlist';

    clearContentId(data);
    updateSettingsByType(data);

    if (data.contentId) {
      try {
        const previousContent = await dbGet(uri.replace('@published', ''),locals);

        if (previousContent.contentId && data.contentId !== previousContent.contentId) {
          return getVideoDetails(data.contentId, data.isPlaylist)
            .then(videoDetails => setVideoDetails(data, videoDetails));
        }
        return data;
      } catch (e) { // do nothing
      }
    }

    // Missing contentId is technically not invalid. Do not show an error.
    data.videoValid = true;
    return data;
  };

module.exports = {
  _internals: __,
  render,
  save
};
