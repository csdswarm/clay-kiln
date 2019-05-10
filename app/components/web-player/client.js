'use strict';

// Instantiate player interface.
const clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')(),
  recentStations = require('../../services/client/recentStations'),
  Audio = require('../../global/js/classes/Audio');

let webPlayer = null;

class WebPlayer extends Audio {
  constructor(component) {
    super(component);
  }
  /**
   * @override
   */
  createMedia(component) {
    const media = { };

    return { id: component.id, media, node: component, persistent: true };
  }
  /**
   * adds an event for the specific video type
   *
   * @override
   * @param {string} type
   * @param {function} listener
   */
  addEvent(type, listener) {
    this.getNode().addEventListener(type, listener);
  }
  /**
   * Pause the media
   * @override
   */
  async pause() {
    console.log('web-player PAUSE')

    await clientPlayerInterface.pause();
  }
  /**
   * start the media (can be overridden)
   * @override
   */
  async play() {
    console.log('web-player PLAY')
    await clientPlayerInterface.play();
  }
  /**
   * mute the player
   *
   * @override
   */
  async mute() {
    // web-player is not allowed to be muted
  }
  /**
   * unmute the player
   *
   * @override
   */
  async unmute() {
    // web-player is not allowed to be muted
  }
}

// Add player mount channel.
clientCommunicationBridge.addChannel('ClientWebPlayerMountPlayer', async () => {
  await clientPlayerInterface.mountPlayer();

  const dumbComponent = document.createElement('div');

  dumbComponent.id = 'radio-web-player';
  webPlayer = new WebPlayer(dumbComponent);

  return true;
});

// Listen for player to start playback.
clientCommunicationBridge.addChannel('ClientWebPlayerPlaybackStatus', async (payload) => {
  const { id, playingClass, playerState } = payload;

  if (playerState === 'play') {
    recentStations.add(id);
  }
  syncPlayerButtons(id, playingClass);

  console.log('dispatching media ', playerState)
  if (playerState === 'play') {
    // since events are being added to the component node, use them to dispatch the event
    webPlayer.getNode().dispatchEvent(new CustomEvent(webPlayer.getEventTypes().MEDIA_PLAY));
  } else {
    webPlayer.getNode().dispatchEvent(new CustomEvent(webPlayer.getEventTypes().MEDIA_STOP));
  }

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
