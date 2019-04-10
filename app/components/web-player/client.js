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
  const { stationId: currentlyPlayingStationId, playbackStatus } = payload;

  syncPlayerButtons(currentlyPlayingStationId, playbackStatus);
});

/**
 *
 * Add player main button click event delegation to document so we can
 * capture main player button clicks as well for play button sync.
 *
 */
document.addEventListener('click', async (event) => {
  if (event.target.id === 'playButton') {

    const currentStationId = await clientCommunicationBridge.sendMessage('SpaPlayerInterfaceGetCurrentStationId');

    /**
     * TODO
     *
     * We need a public API added to RadioPlayer similar to RadioPlayer.getCurrentStationId()
     * but it should return playback status. Even something like RadioPlayer.isPlaying() returning
     * true/false would be much better than determining play status via css class...
     *
     * https://entercomdigitalservices.atlassian.net/browse/PLAYER-390
     */
    // eslint-disable-next-line one-var
    const playbackStatus = (event.target.classList.contains('stop')) ? 'stop' : 'play';

    syncPlayerButtons(currentStationId, playbackStatus);
  }
});

function syncPlayerButtons(currentStationId, playbackStatus) {
  const playerButtons = window.document.querySelectorAll('[data-play-station]');

  // Synchronize player buttons.
  playerButtons.forEach((element) => {
    const buttonStationId = element.dataset.playStation;

    if (playbackStatus === 'play') {
      if (buttonStationId == currentStationId) {
        element.classList.replace('show__play', 'show__pause');
      } else {
        element.classList.replace('show__pause', 'show__play');
      }
    } else {
      element.classList.replace('show__pause', 'show__play');
    }
  });
}
