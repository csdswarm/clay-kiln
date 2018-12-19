'use strict';

function Constructor(el) {
  const videoConfig = {
    videoContainerId: el.getAttribute('data-element-id').trim(),
    videoId: el.getAttribute('data-video-id').trim()
  };

  this.el = el;

  // if the YouTube api is ready the videos(s) can be loaded
  if (window.nymYTApiReady === true) {
    this.player = new YT.Player(videoConfig.videoContainerId, { // eslint-disable-line no-unused-vars
      videoId: videoConfig.videoId,
      height: 'auto',
      width: '100%'
    });
  } else {
    // wait and listen for the YouTube api to be ready before loading the video(s)
    document.addEventListener('clay-youtube-event:youtube-api-ready', function () {
      this.player = new YT.Player(videoConfig.videoContainerId, { // eslint-disable-line no-unused-vars
        videoId: videoConfig.videoId,
        height: 'auto',
        width: '100%'
      });
    });
  }
}

module.exports = el => new Constructor(el);
