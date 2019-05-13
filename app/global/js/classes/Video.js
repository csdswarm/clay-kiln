'use strict';

//TODO JSDOCS

const Media = require('./Media'),
  { isMobileWidth } = require('../../../services/client/mobile');

class Video extends Media {
  constructor(el, options) {
    const videoOptions = { type: 'Video' },
      superOptions =  options ? { ...options, ...videoOptions } : videoOptions;

    super(el, superOptions);
  }
  prepareMedia() {
    const eventTypes = this.getEventTypes();

    // autoplay muted else pause for videos
    this.log('ADD EVENT FOR INITIAL STATE')
    this.addEvent(eventTypes.MEDIA_READY, async () => {
      await this.autoPlayOrPause();
      super.prepareMedia();
    });
  }
  async autoPlayOrPause() {
    const eventTypes = this.getEventTypes();

    if (!isMobileWidth() && this.getNode().closest('.body__header .lead')) {
      console.log('INITIAL STATE PLAY')
      await this.mute();
      await this.play();
    } else {
      console.log('INITIAL STATE PAUSE')
      await this.pause();
      await this.unmute();
    }

    if (eventTypes.MEDIA_VOLUME) {
      // once the media has played once, add the volume watcher
      this.addEvent(eventTypes.MEDIA_PLAY, () => {
          this.addEvent(eventTypes.MEDIA_VOLUME, () => { console.log('VOLUME CHANGE'); this.pauseOtherActiveMedia(); });
        },
        { once: true }
      );
    }
  }
}

module.exports = Video;
