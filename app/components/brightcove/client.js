'use strict';

// Polyfill
const Video = require('../../global/js/classes/Video');

class Brightcove extends Video {
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(videoPlayer, { script: `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js` });
  }
  /**
   * Construct the player
   *
   * @override
   * @param {Element} component
   * @return {object}
   */
  createMedia(component) {
    // eslint-disable-next-line no-undef
    const id = component.getAttribute('id'),
      media = bc(id),
      node = media.el();

    return { id, media, node };
  }
  /**
   * Returns the event types for the video, should be overloaded
   *
   * @override
   * @return {object}
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
   * adds an event for the specific video type
   *
   * @override
   * @param {string} type
   * @param {function} listener
   */
  addEvent(type, listener) {
    this.getMedia().on(type, listener);
  }
  /**
   * mute the player
   *
   * @override
   */
  async mute() {
    // console.log('brightcove mute')
    await this.getMedia().muted(true);
  }
  /**
   * unmute the player
   *
   * @override
   */
  async unmute() {
    // console.log('brightcove unmute')
    await this.getMedia().muted(false);
  }
}

module.exports = el => new Brightcove(el);
