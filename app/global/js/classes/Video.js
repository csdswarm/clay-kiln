'use strict';

// Polyfill
require('intersection-observer');
const { isMobileWidth } = require('../../../services/client/mobile'),
  videoActivePlayers = [],
  clearActivePlayers = () => {
    // cleanup Listener
    document.removeEventListener('dismount', clearActivePlayers);

    videoActivePlayers.length = 0;
  };

class Video {
  /**
   * @param {Element} component
   * @param {string} script
   */
  constructor(component, script) {
    const videoObserver = new IntersectionObserver(this.videoIsInView.bind(this), {threshold: 0}),
      s = document.createElement('script');

    s.src = script;
    // Add the script tag to the document
    document.body.appendChild(s);
    // Call a function to play the video once player's JavaScript loaded
    s.onload = () => {
      const { id, player, node } = this.createPlayer(component),
        eventTypes = this.getEventTypes();

      this.id = id;

      // listen to the global page dismount to clear out the players
      if (videoActivePlayers.length === 0) {
        // Listener for dismount to delete videos
        document.addEventListener('dismount', clearActivePlayers);
      }

      // Keep track of all videos on page
      videoActivePlayers.push({ id,  player });

      // Observe video for if it goes out of view
      videoObserver.observe(node);

      // // When a video begins playing trigger a stop on all others on page (must track video and ad events)
      this.addEvent(player, eventTypes.video_start, this.pauseOtherActivePlayers.bind(this));
      this.addEvent(player, eventTypes.ad_start, this.pauseOtherActivePlayers.bind(this));

      // autoplay muted else pause
      this.addEvent(player, eventTypes.video_ready, () => {
        if (!isMobileWidth() && node.closest('.body__header .lead')) {
          this.play(player);
        } else {
          this.pause(player);
        }
      });
    };
  }
  /**
   * Construct the player (needs to be overloaded)
   *
   * @param {Element} component
   * @return {object}
   */
  createPlayer(component) {
    return { id: component.id, player: component.player, node: component.node };
  }
  /**
   * Returns the player (needs to be overloaded)
   *
   * @param {string} id
   * @return {object}
   */
  getPlayer(id) {
    const video = videoActivePlayers.find((player) => player.id === id);

    return video ? video.player : undefined;
  }
  /**
   * Returns the id of player
   *
   * @return {string}
   */
  getPlayerId() {
    return this.id;
  }
  /**
   * Returns the start events for of player
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      video_start: '',
      video_ready: '',
      ad_start: ''
    };
  }
  /**
   * Returns the start events for of player
   *
   * @param {Element} object
   * @param {string} type
   * @param {function} listener
   */
  addEvent(object, type, listener) {
    object.addEventListener(type, listener);
  }
  /**
   * Check if the video has gone out of view
   *
   * @param {array} changes
   */
  videoIsInView(changes) {
    changes.forEach(change => {
      if (change.intersectionRatio === 0) {
        this.pause(this.getPlayer(this.getPlayerId()));
      }
    });
  }
  /**
   * Pause the player
   *
   * @param {object} player
   */
  pause(player) {
    if (player) {
      player.pause();
    }
  }
  /**
   * start the player
   *
   * @param {object} player
   */
  play(player) {
    if (player) {
      player.play();
    }
  }
  /**
   * Loop over all players on page and pause them if it's not the video in question
   */
  pauseOtherActivePlayers() {
    // Loop over all players on the current page
    videoActivePlayers.forEach((playerOnPage) => {
      if (this.getPlayerId() !== playerOnPage.id) {
        this.pause(playerOnPage.player);
      }
    });
  }
}

module.exports = Video;
