'use strict';

const Video = require('../../global/js/classes/Video');

//TODO do we need ad_play and ad_volumne also?


class YouTube extends Video {
  constructor(el) {
    console.log('WAT', el);
    const options = {
      script: 'https://www.youtube.com/player_api',
      callback: 'onYouTubePlayerAPIReady',
      config: {
        videoConfig: {
          videoContainerId: el.getAttribute('data-element-id').trim(),
          contentId: el.getAttribute('data-content-id').trim(),
          isPlaylist: el.getAttribute('data-is-playlist') === 'true'
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
      }
    };

    if (options.config.videoConfig.isPlaylist) {
      options.config.playerOptions = {
        ...options.config.playerOptions,
        playerVars:{
          listType: 'playlist',
          list: options.config.videoConfig.contentId
        }
      };
    } else {
      options.config.playerOptions = {
        ...options.config.playerOptions,
        videoId: options.config.videoConfig.contentId
      };
    }

    super(el, options);
  }

  /**
   * responds to the player state changes dispatching the events
   *
   * @param {Event} event
   */
  onPlayerStateChange(event) {
    console.log(event.data, this)
    if (event.data === YT.PlayerState.PLAYING) {
      this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_PLAY));
    }
  }

  /**
   * responds to the player being ready dispatching the events
   *
   */
  onPlayerReady() {
    console.log('onPlayerReady')
    this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_READY));
  }

  /**
   * responds to the player volume dispatching the events
   *
   */
  onPlayerVolumeChange() {
    console.log('onPlayerVolumeChange')

    this.getNode().dispatchEvent(new Event(this.getEventTypes().MEDIA_VOLUME));
  }

  /**
   * @override
   */
  createMedia(component, config) {
    const media = new YT.Player(config.videoConfig.videoContainerId, config.playerOptions);

window.youtube = media;
console.log('create', component)
    return { id: component.dataset.elementId, media, node: component };
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
   * Pause the media
   * @override
   */
  async pause() {
    console.log('youtube PAUSE', this.getMedia())

    await this.getMedia().pauseVideo();
  }
  /**
   * start the media (can be overridden)
   * @override
   */
  async play() {
    console.log('youtube PLAY')
    await this.getMedia().playVideo();
  }
  /**
   * mute the player
   *
   * @override
   */
  async mute() {
    console.log('youtube MUTE')
    await this.getMedia().mute();
  }
  /**
   * unmute the player
   *
   * @override
   */
  async unmute() {
    console.log('youtube UNMUTE')
    await this.getMedia().unMute();
  }
}

module.exports = el => new YouTube(el);
