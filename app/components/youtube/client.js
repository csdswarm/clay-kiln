'use strict';

const Video = require('../../global/js/classes/Video');


let callback = 'onYouTubePlayerAPIReady';

// if something else has loaded the youtube library, then don't rely on the callback
if (!(window.YT && window.YT.Player)) {
  callback = null;
}

class YouTube extends Video {
  constructor(el) {
    const options = {
      script: 'https://www.youtube.com/player_api',
      callback
    };

    super(el, options);
  }

  /**
   * dispatch an event from the node
   *
   * @param {string} event
   */
  dispatchEvent(event) {
    this.getNode().dispatchEvent(new Event(event));
  }

  /**
   * responds to the player state changes dispatching the events
   *
   * @param {Event} event
   */
  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.dispatchEvent(this.getEventTypes().MEDIA_PLAY);
    } else if (event.data === YT.PlayerState.PAUSED) {
      this.dispatchEvent(this.getEventTypes().MEDIA_PAUSE);
    }
  }

  /**
   * responds to the player being ready dispatching the events
   *
   */
  onPlayerReady() {
    this.dispatchEvent(this.getEventTypes().MEDIA_READY);
  }

  /**
   * responds to the player volume dispatching the events
   *
   * @param {object} event
   */
  onPlayerVolumeChange(event) {
    if (!this.currentVolume) {
      this.currentVolume = event.data;
    }

    // youtube dispatches the volume change event event when it hasn't changed
    if (this.currentVolume.muted !== event.data.muted || this.currentVolume.volume !== event.data.volume) {
      this.currentVolume = event.data;
      this.dispatchEvent(this.getEventTypes().MEDIA_VOLUME);
    }
  }
  /**
   * @override
   */
  async createMedia(component) {
    const config = {
      videoConfig: {
        videoContainerId: component.getAttribute('data-element-id').trim(),
        contentId: component.getAttribute('data-content-id').trim(),
        isPlaylist: component.getAttribute('data-is-playlist') === 'true'
      },
      playerOptions: {
        height: 'auto',
        width: '100%',
        // relay events back to the super class
        events: {
          onReady: () => this.onPlayerReady(),
          onStateChange: (event) => this.onPlayerStateChange(event),
          onVolumeChange: (event) => this.onPlayerVolumeChange(event)
        }
      }
    };

    if (config.videoConfig.isPlaylist) {
      config.playerOptions = {
        ...config.playerOptions,
        playerVars:{
          listType: 'playlist',
          list: config.videoConfig.contentId
        }
      };
    } else {
      config.playerOptions = {
        ...config.playerOptions,
        videoId: config.videoConfig.contentId
      };
    }

    // Race conditions occur where YT is defined, but the Player constructor has not been created yet.
    if (YT.Player) {
      return Promise.resolve({
        id: component.dataset.elementId,
        media: new YT.Player(config.videoConfig.videoContainerId, config.playerOptions),
        node: component
      });
    } else {
      return new Promise(resolve => setTimeout(() => resolve(this.createMedia(component)), 100));
    }
  }
  /**
   * proxy events through the node
   *
   * @override
   */
  addEvent(type, listener, options) {
    this.getNode().addEventListener(type, listener, options);
  }
  /**
   * @override
   */
  async pause() {
    if (this.getMedia().pauseVideo) {
      await this.getMedia().pauseVideo();
    }
  }
  /**
   * @override
   */
  async play() {
    await this.getMedia().playVideo();
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
    if (this.userInteracted()) {
      await this.getMedia().unMute();
    }
  }
  /**
   * @override
   */
  unmuteOnPlay(eventTypes) {
    // once the media has played once, add an event for the next time it plays
    this.addEvent(eventTypes.MEDIA_PLAY, () => super.unmuteOnPlay(eventTypes), { once: true });
  }
  /**
   * @override
   */
  pauseOnUnmute(eventTypes) {
    // once the youtube has played once, add an event for the next time it plays
    this.addEvent(eventTypes.MEDIA_PLAY, () => super.pauseOnUnmute(eventTypes), { once: true });
  }
}

module.exports = el => new YouTube(el);
