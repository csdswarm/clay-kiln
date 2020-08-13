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
  async createMedia(component) {
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
      events = this.getEventTypes();

    // attach our listener to the media so we can dispatch through the node because their listener does not handle options
    Object.keys(events).forEach(key => media.addEventListener(events[key], (e) => this.dispatchEvent(e)));

    // while the vidible player exists and you can interact with it, there is oddness when hitting a page with
    // a vidible video directly (it works fine with spa navigation), but waiting 100ms seems to let it finish itself
    return new Promise((resolve) => setTimeout(() => resolve({ id, media, node: component.querySelector('div') }), 100));
  }
  /**
   * @override
   */
  getEventTypes() {
    return {
      // eslint-disable-next-line no-undef
      MEDIA_PLAY: vidible.VIDEO_PLAY,
      // eslint-disable-next-line no-undef
      MEDIA_PAUSE: vidible.VIDEO_PAUSE,
      // eslint-disable-next-line no-undef
      MEDIA_READY: vidible.VIDEO_DATA_LOADED,
      // eslint-disable-next-line no-undef
      AD_PLAY: vidible.AD_PLAY,
      // eslint-disable-next-line no-undef
      MEDIA_VOLUME: vidible.VIDEO_VOLUME_CHANGED
    };
  }
  /**
   * dispatch an event from the node
   *
   * @param {string} event
   */
  dispatchEvent(event) {
    // eslint-disable-next-line no-undef
    if (event.type !== vidible.VIDEO_PLAY || this.userInteracted()) {
      this.getNode().dispatchEvent(new CustomEvent(event.type, event.data));
    }
  }
  /**
* @override
*/
  addEvent(type, listener, options) {
    // proxy events through the node
    this.getNode().addEventListener(type, listener, options);
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

    if (this.userInteracted() && await media.isMuted()) {
      await media.toggleMute();
      // vidible seems to have a null volume too often, so set the volume to full so there is sound
      if (!await media.getPlayerInfo().volume) {
        await media.volume(1);
      }
    }
  }
}

module.exports = el => new VerizonMedia(el);
