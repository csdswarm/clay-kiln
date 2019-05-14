'use strict';

const Video = require('../../global/js/classes/Video');

class VerizonMedia extends Video {
  /**
   * @override
   */
  constructor(verizonMediaComponent) {
    super(verizonMediaComponent.querySelector('video-js'), {
      script: '//cdn.vidible.tv/prod/player/js/latest/vidible-min.js'
    });
  }
  /**
   * @override
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
      id = component.getAttribute('data-video-id');

    return { id, media, node: component };
  }
  /**
   * @override
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
   * @override
   */
  async mute() {
    await this.getMedia().mute();
  }
  /**
   * @override
   */
  async unmute() {
    const media = this.getMedia();

    if (await media.isMuted()) {
      await media.toggleMute();
    }
  }
  /**
   * @override
   */
  unmuteOnPlay(eventTypes) {
    // once the media has played once, add an event for the next time it plays
    this.addEvent(eventTypes.MEDIA_PLAY, () => super.unmuteOnPlay(eventTypes), { once: true });
  }
}

module.exports = el => new VerizonMedia(el);
