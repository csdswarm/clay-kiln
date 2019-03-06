'use strict';

// Instantiate player interface.
const ClientPlayerInterface = require('../../services/client/ClientPlayerInterface'),
  clientPlayerInterface = new ClientPlayerInterface();

// Listen for SPA event.
document.addEventListener('client/web-player/mount-player', function () {

  clientPlayerInterface.mountPlayer()
    .then(() => {

      // Tell SPA the player is mounted.
      const event = new CustomEvent('spa/web-player/player-mounted');
      
      document.dispatchEvent(event);

    });
});
