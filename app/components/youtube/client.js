'use strict';

function Constructor(el) {
  const videoConfig = {
      videoContainerId: el.getAttribute('data-element-id').trim(),
      contentId: el.getAttribute('data-content-id').trim(),
      isPlaylist: el.getAttribute('data-is-playlist')
    },

    playerOptions = {
      height: 'auto',
      width: '100%'
    };

  if (videoConfig.isPlaylist) {
    Object.assign(playerOptions, {
      playerVars:{
        listType: 'playlist',
        list: videoConfig.contentId
      }
    });
  } else {
    Object.assign(playerOptions, {videoId: videoConfig.contentId});
  }

  this.el = el;

  if (window.nymYTApiReady) {
    loadVideos(this)();
  } else {
    document.addEventListener('clay-youtube-event:youtube-api-ready', loadVideos(this));
  }

  /**
   * returns a function that loads the videos for the client
   * @param {Constructor} client The client (Constructor) instance
   * @returns {function(): YT.Player} a function that loads the video player
   */
  function loadVideos(client) {
    return () => client.player = new YT.Player(videoConfig.videoContainerId, playerOptions);
  }
}

module.exports = el => new Constructor(el);

