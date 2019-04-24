'use strict';

// Instantiate player interface.
const clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')(),
  recentStations = require('../../services/client/recentStations');

// Add player mount channel.
clientCommunicationBridge.addChannel('ClientWebPlayerMountPlayer', async () => {
  await clientPlayerInterface.mountPlayer();
  return true;
});

// Listen for player to start playback.
clientCommunicationBridge.addChannel('ClientWebPlayerPlaybackStatus', async (payload) => {
  const { id, playingClass, nextState } = payload;
  console.log("player nextState: ", nextState);

  if (currentState !== 'play') {
    recentStations.add(id);
  }
  syncPlayerButtons(id, playingClass);
});

/**
 * defaults the class of all data-play-station elements to show__play unless it's the current station then it uses playingClass
 *
 * @param {number} currentStationId
 * @param {string} playingClass
 */
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
