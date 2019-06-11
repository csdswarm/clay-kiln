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

    this.userInteraction = false;
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
      id = component.getAttribute('data-video-id'),
      events = this.getEventTypes();

    // attach our listener to the media so we can dispatch through the node because their listener does not handle options
    Object.keys(events).forEach(key => media.addEventListener(events[key], (e) => this.dispatchEvent(e)));

    // vidible calls the play event each time a new video is loaded, so in order to determine when a video should
    // unmute and be able to pause other videos, once the video has paused, any additional interactions would have to be
    // from the user
    // eslint-disable-next-line no-undef
    media.addEventListener(vidible.VIDEO_PAUSE, () => {
      this.userInteraction = true;
    }, { once: true });
    // eslint-disable-next-line no-undef
    media.addEventListener(vidible.VIDEO_VOLUME_CHANGED, () => {
      this.userInteraction = true;
    }, { once: true });

    return { id, media, node: component.querySelector('div') };
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
   * dispatch an event from the node
   *
   * @param {string} event
   */
  dispatchEvent(event) {
    this.getNode().dispatchEvent(new CustomEvent(event.type, event.data));
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

    if (this.userInteraction && await media.isMuted()) {
      await media.toggleMute();
      // vidible seems to have a null volume too often, so set the volume to full so there is sound
      if (!await media.getPlayerInfo().volume) {
        await media.volume(1);
      }
    }
  }
  /**
   * @override
   */
  pauseOtherActiveMedia() {
    // only pause if the user has actually interacted with the player
    if (this.userInteraction) {
      return super.pauseOtherActiveMedia();
    }
  }
}

module.exports = el => new VerizonMedia(el);
