'use strict';

let videos = [];

// Listener for dismount to delete videos
document.addEventListener('brightcove-dismount', () => {
  videos = [];
});

function Constructor(el) {
  let videoPlayer = el.querySelector('video-js'),
    id = videoPlayer.getAttribute('id'),
    brightcoveAccount = videoPlayer.getAttribute('data-account'),
    brightcovePlayerId = videoPlayer.getAttribute('data-player');
  // Add and execute the player script tag
  var s = document.createElement('script');

  s.src = `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`;
  // Add the script tag to the document
  document.body.appendChild(s);
  // Call a function to play the video once player's JavaScript loaded
  s.onload = function () {
    const player = bc(id);

    // autoplay muted
    player.on('loadedmetadata', () => {
      player.muted(true);
      player.play();
    });
    videos.push(player);
  };
}

module.exports = el => new Constructor(el);
