'use strict';

// Instantiate player interface.
const clientPlayerInterface = require('../../services/client/ClientPlayerInterface')();

// Listen for SPA event.
document.addEventListener('clientWebPlayerMountPlayer', function () {

  clientPlayerInterface.mountPlayer()
    .then(() => {

      // Tell SPA the player is mounted.
      const event = new CustomEvent('spaWebPlayerPlayerMounted');
      
      document.dispatchEvent(event);

    });
});
