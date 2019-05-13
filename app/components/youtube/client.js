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
   * responds to the player state changes dispatching the events
   *
   * @param {Event} event
   */
  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_PLAY));
    }
  }

  /**
   * responds to the player being ready dispatching the events
   *
   */
  onPlayerReady() {
    this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_READY));
  }

  /**
   * responds to the player volume dispatching the events
   *
   */
  onPlayerVolumeChange() {
    this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_VOLUME));
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
        // relay events back to the class
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
    console.log('YOUTUBE create', component)

    const media = new YT.Player(config.videoConfig.videoContainerId, config.playerOptions);

window.youtube = media;
    return { id: component.dataset.elementId, media, node: component };
  }
  /**
   * proxy events through the node
   *
   * @override
   */
  addEvent(type, listener) {
    console.log('ADD EVENT', type, this.getNode())
    this.getNode().addEventListener(type, listener);
  }
  /**
   * Pause the media
   * @override
   */
  async pause() {
    console.log('youtube PAUSE', this, this.getMedia(), this.getMedia().pauseVideo, this.getMedia().playVideo)

    await this.getMedia().pauseVideo();
  }
  /**
   * start the media (can be overridden)
   * @override
   */
  async play() {
    // console.log('youtube PLAY')
    await this.getMedia().playVideo();
  }
  /**
   * mute the player
   *
   * @override
   */
  async mute() {
    // console.log('youtube MUTE')
    await this.getMedia().mute();
  }
  /**
   * unmute the player
   *
   * @override
   */
  async unmute() {
    // console.log('youtube UNMUTE')
    await this.getMedia().unMute();
  }
}

module.exports = el => new YouTube(el);
