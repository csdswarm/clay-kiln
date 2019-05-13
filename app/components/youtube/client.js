'use strict';

const Video = require('../../global/js/classes/Video');

class YouTube extends Video {
  constructor(el) {
    const options = {
      script: 'https://www.youtube.com/player_api',
      callback: 'onYouTubePlayerAPIReady'
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
   */
  onPlayerVolumeChange() {
    this.dispatchEvent(this.getEventTypes().MEDIA_VOLUME);
  }

  /**
   * @override
   */
  createMedia(component) {
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
          onVolumeChange: () => this.onPlayerVolumeChange()
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

    return {
      id: component.dataset.elementId,
      media: new YT.Player(config.videoConfig.videoContainerId, config.playerOptions),
      node: component
    };
  }
  /**
   * proxy events through the node
   *
   * @override
   */
  addEvent(type, listener) {
    this.getNode().addEventListener(type, listener);
  }
  /**
   * @override
   */
  async pause() {
    await this.getMedia().pauseVideo();
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
    await this.getMedia().unMute();
  }
}

module.exports = el => new YouTube(el);
