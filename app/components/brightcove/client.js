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
      player = bc(id),
      node = player.el();

    return { id, player, node };
  }
  /**
   * Returns the start events for of player
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      video_start: 'play',
      video_ready: 'loadedmetadata',
      ad_start: 'ads-play'
    };
  }
  /**
   * Returns the start events for of player
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
