'use strict';

const youtubeVideoPlayer = require('../../services/universal/youtube-video-player');


function Constructor(el) {
  var videoConfig = {
    videoContainerId: el.getAttribute('data-element-id').trim(),
    videoId: el.getAttribute('data-video-id').trim(),
    // player variables and settings
    playerParams: {
      loop: 1,
      listType: 'playlist',
      list: el.getAttribute('data-playlist').trim(),
      autoplay: el.getAttribute('data-autoplay-video') === 'true' ? 1 : 0,
      controls: 1,
      enablejsapi: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      wmode: 'transparent'
    },
    customParams: {
      autoPlayNextVideo: el.getAttribute('data-autoplay-next-video').trim(),
      trackVideoType: el.getAttribute('data-track-video-type').trim()
    }
  }

  if (videoConfig.customParams.trackVideoType === 'Sponsored') {
    videoConfig.playerParams.list = '';
  }
  this.el = el;

  // if the YouTube api is ready the videos(s) can be loaded
  if (window.nymYTApiReady === true) {
    youtubeVideoPlayer.init(videoConfig);
  } else {
    // wait and listen for the YouTube api to be ready before loading the video(s)
    document.addEventListener('clay-youtube-event:youtube-api-ready', function() {
      youtubeVideoPlayer.init(videoConfig);
    });
  }

  /**
   * Player start event
   *
   * we don't need to send an event here, updating the video id for posterity
   * also might be nice to send an event if we see the video id changed?
   */
  document.addEventListener('player-start-' + videoConfig.videoContainerId, function(evt) {
    var hasChanged = el.getAttribute('data-video-id') !== evt.player.videoId;

    if (hasChanged) {
      updateElementAttributes(el, evt.player);
    }
  });
}

/**
 * Updates Element attributes
 * @param {Object} el - DOM node element
 * @param {Object} config - Attributes values from player
 */
function updateElementAttributes(el, config) {
  el.setAttribute('data-video-id', config.videoId);
}

module.exports = el => new Constructor(el);