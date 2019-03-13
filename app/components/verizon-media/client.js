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

    ['PLAYER_READY','VIDEO_DATA_LOADED','CONTEXT_STARTED', 'VIDEO_START', 'VIDEO_PAUSE', 'VIDEO_PLAY', 'VIDEO_SELECTED', 'VIDEO_SEEKEND', 'VIDEO_END', 'AD_START', 'AD_END'].forEach((item) => {
      console.log(item);
      player.addEventListener(item, vidible[item], () => console.log(id, item));
    });

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
  play(player) {
    console.log('play', player)
    if (player) {
      player.mute();
      console.log('mute')
      player.play();
      console.log('play')
    }
  }
}

module.exports = el => new VerizonMedia(el);
