'use strict';

const Media = require('./Media'),
  { isMobileWidth } = require('../../../services/client/mobile');

class Video extends Media {
  /**
   * @override
   */
  constructor(el, options) {
    super(el, options);

    this.userInteraction = false;
  }
  /**
   * @override
   */
  prepareMedia() {
    const eventTypes = this.getEventTypes();

    // autoplay muted else pause for videos once it is ready
    this.addEvent(eventTypes.MEDIA_READY, () => this.autoPlayOrPause(), { once: true });
  }
  /**
   * add event to unmute the video if the user clicks play
   *
   * @param {object} eventTypes
   */
  unmuteOnPlay(eventTypes) {
    this.addEvent(eventTypes.MEDIA_PLAY, () => this.unmute());
  }
  /**
   * adds events for when the user has interacted with the video
   *
   * @param {object} eventTypes
   */
  addInteractionEvents(eventTypes) {
    // unmute and be able to pause other videos, once the video has paused, any additional interactions would have to be
    // from the user
    this.addEvent(eventTypes.MEDIA_PAUSE, () => { this.log('PAUSE interaction'); this.userInteraction = true; }, { once: true });
    this.addEvent(eventTypes.MEDIA_VOLUME, () => { this.log('VOLUME interaction'); this.userInteraction = true; }, { once: true });
  }
  /**
   * returns if the user has interacted with with player
   *
   * @returns {boolean}
   */
  userInteracted() {
    return this.userInteraction;
  }
  /**
   * add the event to pause other media on volume change
   *
   * @param {object} eventTypes
   */
  pauseOnUnmute(eventTypes) {
    // the volume watcher since some videos change volume on play/pause causing things to pause
    this.addEvent(eventTypes.MEDIA_VOLUME, () => this.pauseOtherActiveMedia());
    if (eventTypes.AD_VOLUME) {
      this.addEvent(eventTypes.AD_VOLUME, () => this.pauseOtherActiveMedia());
    }
  }
  /**
   * automatically play the lede video while muted, otherwise unmute and pause the video
   *
   * @return {Promise<void>}
   */
  async autoPlayOrPause() {
    const eventTypes = this.getEventTypes();

    // auto play muted the video if it is the main lede
    if (!isMobileWidth() && this.isLead()) {
      await this.mute();
      await this.play();
    } else {
      await this.pause();
      await this.unmute();
    }

    super.prepareMedia();

    this.addInteractionEvents(eventTypes)
    this.unmuteOnPlay(eventTypes);
    this.pauseOnUnmute(eventTypes);
  }
  /**
   * @override
   */
  async unmute() {
    // only unmute if the user has interacted with the video
    if (this.userInteracted()) {
      await super.unmute();
    }
  }
  /**
   * @override
   */
  pauseOtherActiveMedia() {
    // only pause if the user has interacted with the video
    if (this.userInteracted()) {
      return super.pauseOtherActiveMedia();
    }
  }
}

module.exports = Video;
