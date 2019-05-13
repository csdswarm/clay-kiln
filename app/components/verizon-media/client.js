'use strict';

const Video = require('../../global/js/classes/Video');

class VerizonMedia extends Video {
  constructor(verizonMediaComponent) {
    super(verizonMediaComponent.querySelector('video-js'), { script: '//cdn.vidible.tv/prod/player/js/latest/vidible-min.js' });
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
    const media = vidible.player(component.getAttribute('id')).setup({
        bcid: component.getAttribute('data-company'),
        pid: component.getAttribute('data-player'),
        videos: component.getAttribute('data-video-id'),

        // Optional - macros
        'm.playback': 'pause',
        'm.responsive': 'true'
      }).load(),
      id = component.getAttribute('data-video-id'),
      node = component;

    return { id, media, node };
  }
  /**
   * * Returns the event types for the video, should be overloaded
   *
   * @override
   * @return {object}
   */
  getEventTypes() {
    return {
      // eslint-disable-next-line no-undef
      MEDIA_PLAY: vidible.VIDEO_PLAY,
      // eslint-disable-next-line no-undef
      MEDIA_READY: vidible.VIDEO_DATA_LOADED,
      // eslint-disable-next-line no-undef
      AD_PLAY: vidible.AD_PLAY,
      // eslint-disable-next-line no-undef
      MEDIA_VOLUME: vidible.VIDEO_VOLUME_CHANGED
    };
  }
  /**
   * mute the player
   *
   * @override
   */
  async mute() {
    await this.getMedia().mute();
  }
  /**
   * unmute the player
   *
   * @override
   */
  async unmute() {
    const media = this.getMedia();

    if (await media.isMuted()) {
      await media.toggleMute();
    }
  }
}

module.exports = el => new VerizonMedia(el);
