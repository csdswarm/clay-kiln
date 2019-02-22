'use strict';

// TODO - The host should not be hard-coded here.
const playerJsBundleUrl = 'http://clay.radio.com/web-player/radio-player.min.js'

class PlayerManager {

  /**
   *
   * Mount the player
   *
   */
  mount() {
    return new Promise((resolve, reject) => {

      // Throw timeout error to handle promise "reject" case if this hangs for whatever reason.
      setTimeout(() => {
        reject(new Error('Player JS bundle timed out during loading.'));
      }, 1000);

      const firstScript = document.getElementsByTagName('script')[0],
        newScript = document.createElement('script');

      
      newScript.onload = () => {
        return resolve();
      };
      newScript.src = playerJsBundleUrl;

      firstScript.parentNode.insertBefore(newScript, firstScript);

    });
    
  }

}

const playerManager = new PlayerManager()

document.addEventListener('web-player-head/load-player', function (event) {

  playerManager.mount()
    .then(() => {

      // Tell SPA the player is loaded
      const event = new CustomEvent('web-player-head/player-loaded');
      
      document.dispatchEvent(event);

    })
  
});