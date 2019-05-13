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
    });
  }
  /**
   * automatically play the lede video while muted, otherwise unmute and pause the video
   *
   * @return {Promise<void>}
   */
  async autoPlayOrPause() {
    const eventTypes = this.getEventTypes(),
      nextPlayEvent = () => {
        // if the video started out muted, unmute it now since the user made it play
        this.addEvent(eventTypes.MEDIA_PLAY, () => this.unmute(), { once: true });
        if (eventTypes.MEDIA_VOLUME) {
          // the volume watcher since some videos change volume on play/pause causing things to pause
          this.addEvent(eventTypes.MEDIA_VOLUME, () => this.pauseOtherActiveMedia());
        }
      };

    // auto play muted the video if it is the main lede
    if (!isMobileWidth() && this.getNode().closest('.body__header .lead')) {
      await this.mute();
      await this.play();

      // once the media has started playing, run the super to finish setting it up
      this.addEvent(eventTypes.MEDIA_PLAY, () => super.prepareMedia(), { once: true });
    } else {
      await this.pause();
      await this.unmute();

      // run the super immediately to ensure everything is prepared correctly
      super.prepareMedia();
    }


    // once the media has played once, add an event for the next time it plays
    this.addEvent(eventTypes.MEDIA_PLAY, nextPlayEvent, { once: true });
  }
}

module.exports = Video;
