'use strict';

// Polyfill
const Video = require('../../global/js/classes/Video');

class Brightcove extends Video {
  /**
   * @override
   */
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(videoPlayer, {
      script: `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`
    });
  }
  /**
   * @override
   */
  createMedia(component) {
    const id = component.getAttribute('id'),
      media = bc(id),
      node = media.el();

    return { id, media, node };
  }
  /**
   * @override
   */
  getEventTypes() {
    return {
      MEDIA_PLAY: 'play',
      MEDIA_READY: 'loadedmetadata',
      AD_PLAY: 'ads-play',
      MEDIA_VOLUME: 'volumechange'
    };
  }
  /**
   * use the brightcove event listener
   *
   * @override
   */
  addEvent(type, listener, options) {
    if (options && options.once) {
      this.getMedia().one(type, listener);
    } else {
      this.getMedia().on(type, listener);
    }
  }
  /**
   * @override
   */
  async mute() {
    await this.getMedia().muted(true);
  }
  /**
   * @override
   */
  async unmute() {
    await this.getMedia().muted(false);
  }
}

module.exports = el => new Brightcove(el);
