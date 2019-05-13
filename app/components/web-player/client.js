'use strict';

// Instantiate player interface.
const clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')(),
  recentStations = require('../../services/client/recentStations'),
  Audio = require('../../global/js/classes/Audio');

let webPlayer = null;

class WebPlayer extends Audio {
  /**
   * @override
   */
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
   * proxy events through the node
   *
   * @override
   */
  addEvent(type, listener) {
    this.getNode().addEventListener(type, listener);
  }
  /**
   * @override
   */
  async pause() {
    await clientPlayerInterface.pause();
  }
  /**
   * @override
   */
  async play() {
    await clientPlayerInterface.play();
  }
  /**
   * @override
   */
  async mute() {
    // web-player is not allowed to be muted only paused
  }
  /**
   * @override
   */
  async unmute() {
    // web-player is not allowed to be muted only paused
  }
}

// Add player mount channel.
clientCommunicationBridge.addChannel('ClientWebPlayerMountPlayer', async () => {
  await clientPlayerInterface.mountPlayer();

  // create an element that can represent the web player
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

  if (playerState === 'play') {
    // since events are being added to the component node, use them to dispatch the event
    webPlayer.getNode().dispatchEvent(new CustomEvent(webPlayer.getEventTypes().MEDIA_PLAY));
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
