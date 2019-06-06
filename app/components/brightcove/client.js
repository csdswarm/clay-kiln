'use strict';

// Polyfill
require('intersection-observer');
const _get = require('lodash/get'),
  Video = require('../../global/js/classes/Video');

class Brightcove extends Video {
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player');

    super(videoPlayer, `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`);

    this.setObserver(brightcoveComponent);
    this.videoPlayer = videoPlayer;
    this.webPlayerPlaybackState = _get(window, 'RadioPlayer.playerControls.playbackState');

    window.addEventListener('playbackStateChange', (e) => {
      this.webPlayerPlaybackState = e.detail.playerState;
      this.removeStickyPlayer();
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
  addStickyPlayer() {
    if (this.webPlayerPlaybackState !== 'play') {
      this.videoPlayer.classList.add('out-of-view');
    }
    this.mute(this.getPlayer(this.getPlayerId()));
  }
  removeStickyPlayer() {
    this.videoPlayer.classList.remove('out-of-view');
  }
  /**
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
