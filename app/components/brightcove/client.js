'use strict';

// Polyfill
require('intersection-observer');
const Video = require('../../global/js/classes/Video');

class Brightcove extends Video {
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(videoPlayer, `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`);
  }
  /**
   * Construct the player
   *
   * @param {Element} component
   * @return {object}
   */
  createPlayer(component) {
    // eslint-disable-next-line no-undef
    const id = component.getAttribute('id'),
      autoplayUnmuted = component.getAttribute('data-autoplay-unmuted') === 'true',
      clickToPlay = component.getAttribute('data-click-to-play') === 'true',
      player = bc(id),
      node = player.el();

    return { id, player, node, autoplayUnmuted, clickToPlay };
  }
  /**
   * * Returns the event types for the video, should be overloaded
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      VIDEO_START: 'play',
      VIDEO_READY: 'loadedmetadata',
      AD_START: 'ads-play'
    };
  }
  /**
   * adds an event for the specific video type
   *
   * @param {Element} object
   * @param {string} type
   * @param {function} listener
   */
  addEvent(object, type, listener) {
    object.on(type, listener);
  }
  /**
   * start the player
   *
   * @param {object} player
   */
  play(player) {
    if (player) {
      player.muted(true);
      player.play();
    }
  }
}

module.exports = el => new Brightcove(el);
