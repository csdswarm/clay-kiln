'use strict';

// Polyfill
require('intersection-observer');
const videoObserver = new IntersectionObserver(videoIsInView, {}),
  { isMobileWidth } = require('../../services/client/mobile');

let activePlayers = [];

// Listener for dismount to delete videos
document.addEventListener('brightcove-dismount', () => {
  activePlayers = [];
});

/**
 * Check if the video has gone out of view
 *
 * @param {array} changes
 */
function videoIsInView(changes) {
  changes.forEach(change => {
    if (change.intersectionRatio === 0) {
      pausePlayer(videojs.getPlayer(change.target.getAttribute('id')));
    }
  });
};

/**
 * Pause the player
 *
 * @param {object} player
 */
function pausePlayer(player) {
  if (typeof player.ima3.adsManager !== 'undefined') {
    player.ima3.adsManager.pause();
  }
  player.pause();
}

/**
 * Loop over all players on page and pause them if it's not the video in question
 */
function pauseOtherActivePlayers() {
  let player = this;

  // Loop over all players on the current page
  activePlayers.forEach((playerOnPage) => {
    if (player.id() !== playerOnPage.id()) {
      pausePlayer(playerOnPage);
    }
  });
}

function Constructor(brightcoveComponent) {
  let videoPlayer = brightcoveComponent.querySelector('video-js'),
    id = videoPlayer.getAttribute('id'),
    brightcoveAccount = videoPlayer.getAttribute('data-account'),
    brightcovePlayerId = videoPlayer.getAttribute('data-player');
  // Add and execute the player script tag
  var s = document.createElement('script');

  s.src = `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`;
  // Add the script tag to the document
  document.body.appendChild(s);
  // Call a function to play the video once player's JavaScript loaded
  s.onload = () => {
    const player = bc(id);

    // Keep track of all videos on page
    activePlayers.push(player);

    // Observe video for if it goes out of view
    videoObserver.observe(player.el(), {threshold: 0});

    // When a video begins playing trigger a stop on all others on page (must track video and ad events)
    player.on('play', pauseOtherActivePlayers);
    player.on('ads-play', pauseOtherActivePlayers);

    if (brightcoveComponent.closest('.body__header .lead') && !isMobileWidth()) {
      // autoplay muted
      player.on('loadedmetadata', () => {
        player.muted(true);
        player.play();
      });
    }
  };
}

module.exports = el => new Constructor(el);
