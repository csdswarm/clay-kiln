'use strict';

// Polyfill
require('core-js/modules/es6.symbol');
const Video = require('../../global/js/classes/Video'),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')();

class Brightcove extends Video {
  /**
   * @override
   */
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(brightcoveComponent, {
      script: `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`
    });

    this.videoPlayerWrapper = brightcoveComponent.querySelector('.player__video');
    this.webPlayerPlaybackState = clientCommunicationBridge.getLatest('ClientWebPlayerPlaybackStatus', {}).playerState;

    clientCommunicationBridge.subscribe('ClientWebPlayerPlaybackStatus', async ({playerState}) => {
      this.webPlayerPlaybackState = playerState;
      if (this.webPlayerPlaybackState === 'play') {
        this.hideStickyPlayer();
      }
    });
  }
  /**
   * @override
   */
  createMedia(component) {
    const video = component.querySelector('video-js'),
      id = video.getAttribute('id'),
      media = bc(id),
      node = component;

    this.autoplayUnmuted = video.getAttribute('data-autoplay-unmuted') === 'true';
    this.clickToPlay = video.getAttribute('data-click-to-play') === 'true';

    return { id, media, node };
  }
  /**
   * @override
   */
  prepareMedia() {
    super.prepareMedia();

    this.addEvent(this.getEventTypes().MEDIA_PLAY, () => {
      this.active = true;
    });
  }
  /**
   * @override
   */
  getEventTypes() {
    return {
      MEDIA_PLAY: 'play',
      MEDIA_PAUSE: 'pause',
      MEDIA_READY: 'loadedmetadata',
      AD_PLAY: 'ads-play',
      MEDIA_VOLUME: 'volumechange',
      AD_VOLUME: 'ads-volumechange'
    };
  }
  /**
   * use the brightcove event listener
   *
   * @override
   */
  addEvent(type, listener, options) {
    if (options && options.once) {
      this.getMedia().one(type, listener);
    } else {
      this.getMedia().on(type, listener);
    }
  }
  /**
   * @override
   */
  async play() {
    if (this.autoplayUnmuted) {
      await this.getMedia().muted(false);
    }
    await this.getMedia().play();
  }
  /**
   * @override
   */
  async pause() {
    this.active = false;
    this.hideStickyPlayer();
    await super.pause();
  }
  /**
   * @override
   */
  async mute() {
    await this.getMedia().muted(true);
  }
  /**
   * @override
   */
  async unmute() {
    // only unmute if the user has actually interacted with the player
    if (this.userInteracted()) {
      await this.getMedia().muted(false);
    }
  }
  /**
   * show brightcove sticky player if web player is paused or not on page
   *
   * @return {Boolean}
   */
  showStickyPlayer() {
    if (clientCommunicationBridge.getLatest('ClientWebPlayerMountPlayer')) {
      this.videoPlayerWrapper.classList.add('web-player-exists');
    }
    if (this.webPlayerPlaybackState !== 'play') {
      // ensure that the height is retained
      this.getNode().style.minHeight = `${this.videoPlayerWrapper.offsetHeight}px`;
      this.videoPlayerWrapper.classList.add('player__video--out-of-view');
      return true;
    }

    return false;
  }
  /**
   * hide the brightcove sticky player
   */
  hideStickyPlayer() {
    // remove the min height
    this.getNode().style.minHeight = 'initial';
    this.videoPlayerWrapper.classList.remove('player__video--out-of-view');
  }
  /**
   * @override
   *
   * Check if the video has gone out of view only when not sticky
   * if web player is paused or not on page
   */
  notInView(changes) {
    let stuck = false;

    changes.forEach(change => {
      if (change.intersectionRatio === 0 && this.active) {
        stuck = this.showStickyPlayer();
      } else {
        this.hideStickyPlayer();
      }
    });
    if (!stuck) {
      super.notInView(changes);
    }
  }
  /**
   * @override
   */
  userInteracted() {
    return this.getMedia().userActive();
  }
  /**
   * @override
   */
  shouldAutoplay() {
    return !this.clickToPlay && super.shouldAutoplay();
  }
}

module.exports = el => new Brightcove(el);