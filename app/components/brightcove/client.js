'use strict';

// Polyfill
require('intersection-observer');
require('core-js/modules/es6.symbol');
const _get = require('lodash/get'),
  Video = require('../../global/js/classes/Video');

class Brightcove extends Video {
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      videoPlayerWrapper = brightcoveComponent.querySelector('.player__video'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(videoPlayer, `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`);

    this.setObserver(brightcoveComponent);
    this.videoPlayerWrapper = videoPlayerWrapper;
    this.webPlayerPlaybackState = _get(window, 'RadioPlayer.playerControls.playbackState');

    // can be updated to use playback stored in sessionStorage once available
    window.addEventListener('playbackStateChange', (e) => {
      this.webPlayerPlaybackState = e.detail.playerState;
      if (this.webPlayerPlaybackState === 'play') {
        this.removeStickyPlayer();
      }
    });
  }
  /**
   * Construct the player
   *
   * @param {Element} component
   * @return {object}
   */
  createPlayer(component) {
    // eslint-disable-next-line no-undef
    const id = component.getAttribute('id'),
      player = bc(id),
      node = player.el();

    return { id, player, node };
  }
  /**
   * * Returns the event types for the video, should be overloaded
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      VIDEO_START: 'play',
      VIDEO_READY: 'loadedmetadata',
      AD_START: 'ads-play'
    };
  }
  /**
   * adds an event for the specific video type
   *
   * @param {Element} object
   * @param {string} type
   * @param {function} listener
   */
  addEvent(object, type, listener) {
    object.on(type, listener);
  }
  /**
   * Initialize an intersectionObserver to watch if the brightcove container is no longer in view
   *
   * @param {component} brightcoveComponent
   */
  setObserver(brightcoveComponent) {
    const brightcoveObserver = new IntersectionObserver(this.containerIsInView.bind(this), {threshold: 0});
    
    brightcoveObserver.observe(brightcoveComponent);
  }
  /**
   * Check if the container has gone out of view
   *
   * @param {array} changes
   */
  containerIsInView(changes) {
    changes.forEach(change => {
      if (change.intersectionRatio === 0) {
        this.addStickyPlayer();
      } else {
        this.removeStickyPlayer();
      }
    });
  }
  /**
   * add brightcove sticky player if web player is paused or not on page
   */
  addStickyPlayer() {
    if (window.RadioPlayer) {
      this.videoPlayerWrapper.classList.add('web-player-exists');
    }
    if (this.webPlayerPlaybackState !== 'play') {
      this.videoPlayerWrapper.classList.add('player__video--out-of-view');
    }
    this.mute(this.getPlayer(this.getPlayerId()));
  }
  /**
   * hide the brightcove sticky player
   */
  removeStickyPlayer() {
    this.videoPlayerWrapper.classList.remove('player__video--out-of-view');
  }
  /**
   * @override
   * Check if the video has gone out of view
   *
   * @param {array} changes
   */
  videoIsInView() {
    // Don't run super videoIsInView
  }
  /**
   * mute the player
   *
   * @param {object} player
   */
  mute(player) {
    if (player) {
      player.muted(true);
    }
  }
  /**
   * start the player
   *
   * @param {object} player
   */
  play(player) {
    if (player) {
      player.muted(true);
      player.play();
    }
  }
}

module.exports = el => new Brightcove(el);
