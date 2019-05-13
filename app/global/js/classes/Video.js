'use strict';

const Media = require('./Media'),
  { isMobileWidth } = require('../../../services/client/mobile');

class Video extends Media {
  /**
   * @override
   */
  constructor(el, options) {
    super(el, options);
  }
  /**
   * @override
   */
  prepareMedia() {
    const eventTypes = this.getEventTypes();

    // autoplay muted else pause for videos once it is ready
    this.addEvent(eventTypes.MEDIA_READY, async () => {
      await this.autoPlayOrPause();
      // run the parent to ensure everything is prepared correctly
      super.prepareMedia();
    });
  }
  /**
   * automatically play the lede video while muted, otherwise unmute and pause the video
   *
   * @return {Promise<void>}
   */
  async autoPlayOrPause() {
    const eventTypes = this.getEventTypes();

    // auto play muted the video if it is the main lede
    if (!isMobileWidth() && this.getNode().closest('.body__header .lead')) {
      await this.mute();
      await this.play();
    } else {
      await this.pause();
      await this.unmute();
    }

    if (eventTypes.MEDIA_VOLUME) {
      this.addEvent(eventTypes.MEDIA_VOLUME, () => { console.log('VOLUME CHANGE'); this.pauseOtherActiveMedia(); });
    }
  }
}

module.exports = Video;
