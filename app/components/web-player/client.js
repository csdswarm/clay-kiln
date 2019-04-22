'use strict';

// Instantiate player interface.
const clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')();

// Add player mount channel.
clientCommunicationBridge.addChannel('ClientWebPlayerMountPlayer', async () => {
  await clientPlayerInterface.mountPlayer();
  return true;
});

// Listen for player to start playback.
clientCommunicationBridge.addChannel('ClientWebPlayerPlaybackStatus', async (payload) => {
  const { id, playingClass } = payload;

  syncPlayerButtons(id, playingClass);
});

function syncPlayerButtons(currentStationId, playingClass) {
  const playerButtons = window.document.querySelectorAll('[data-play-station]');

  // Synchronize player buttons.
  playerButtons.forEach((element) => {
    element.classList.replace('show__pause', 'show__play');
    element.classList.replace('show__stop', 'show__play');

    if (parseInt(element.dataset.playStation) === parseInt(currentStationId)) {
      element.classList.replace('show__play', playingClass);
    }
  });
}
