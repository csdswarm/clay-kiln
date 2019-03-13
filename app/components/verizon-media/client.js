'use strict';

// Polyfill
require('intersection-observer');
const Video = require('../../global/js/classes/Video');

class VerizonMedia extends Video {
  constructor(verizonMediaComponent) {
    super(verizonMediaComponent.querySelector('video-js'), '//cdn.vidible.tv/prod/player/js/latest/vidible-min.js');
  }
  /**
   * Construct the player
   *
   * @param {Element} component
   * @return {object}
   */
  createPlayer(component) {
    // eslint-disable-next-line no-undef
    const player = vidible.player(component.getAttribute('id')).setup({
        bcid: component.getAttribute('data-company'),
        pid: component.getAttribute('data-player'),
        videos: component.getAttribute('data-video-id'),

        // Optional - macros
        'm.playback': 'pause',
        'm.responsive': 'true',
        'm.initialVolume': 100
      }).load(),
      id = component.getAttribute('data-video-id'),
      node = player.sia;

    return { id, player, node };
  }
  /**
   * Returns the start events for of player
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      // eslint-disable-next-line no-undef
      video_start: vidible.VIDEO_PLAY,
      // eslint-disable-next-line no-undef
      video_ready: vidible.VIDEO_DATA_LOADED,
      // eslint-disable-next-line no-undef
      ad_start: vidible.AD_START
    };
  }
  /**
   * start the player
   *
   * @param {object} player
   */
  async play(player) {
    if (player) {
      await player.mute();
      player.play();
    }
  }
}

module.exports = el => new VerizonMedia(el);
