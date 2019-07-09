'use strict';

const clientCommunicationBridge = require('./ClientCommunicationBridge')();

/**
 *
 * ClientPlayerInterface library contains communications/management logic related to the radio-web-player.
 *
 * See also: spa/src/lib/SpaPlayerInterface.js
 *
 */
class ClientPlayerInterface {
  // Mount the player
  mountPlayer() {
    // Get data-attributes from hbs template.
    const webPlayerComponentDiv = document.body.querySelector('div.component--web-player'),
      webPlayerHost = webPlayerComponentDiv.dataset.webPlayerHost,
      parallelPromises = [],
      webPlayerEnv = this.getWebPlayerEnvironment();

    // Load independent player resources in parallel.
    parallelPromises.push(this.lazyLoadCssResource(`${webPlayerHost}${webPlayerEnv}/radio-player.min.css`));
    parallelPromises.push(this.lazyLoadJsResource(`${webPlayerHost}${webPlayerEnv}/radio-player.min.js`));

    return Promise.all(parallelPromises);
  }

  /**
   *
   * Load different player library depending on environment.
   *
   * @returns {string} - The web player environment namespace.
   */
  getWebPlayerEnvironment() {
    const  qs = window.location.search;
    let  webPlayerParam = '';

    if (qs.includes('webplayer')) {
      const params = qs.substring(1).split('&'),
        webPlayer = params.find(item => item.includes('webplayer'));
        
      webPlayerParam = webPlayer.split('=')[1];
    }

    if (webPlayerParam) {
      switch (webPlayerParam) {
        case 'dev':
          return '-dev';
        case 'stg':
          return '-stg';
        default:
          return `-branches/PLAYER-${webPlayerParam}`;
      }
    } else {
      return '';
    }
  }

  /**
   * Lazy load the provided js file
   *
   * @param {string} jsUrl - URL of Js library to lazy load.
   * @returns {Promise<any>}
   */
  lazyLoadJsResource(jsUrl) {
    return new Promise((resolve, reject) => {
      const firstScript = document.getElementsByTagName('script')[0],
        newScript = document.createElement('script');

      newScript.onload = () => {
        return resolve();
      };
      newScript.onerror = () => {
        return reject(new Error(`JS library failed to lazy-load: ${jsUrl}`));
      };
      newScript.src = jsUrl;

      firstScript.parentNode.insertBefore(newScript, firstScript);
    });
  }

  /**
   * Lazy load the provided CSS
   *
   * @param {string} cssUrl - URL of CSS to lazy load.
   * @returns {Promise<any>}
   */
  lazyLoadCssResource(cssUrl) {
    return new Promise((resolve, reject) => {
      const linkTag = document.createElement('link');

      linkTag.rel = 'stylesheet';
      linkTag.onload = () => {
        return resolve();
      };
      linkTag.onerror = () => {
        return reject(new Error(`CSS library failed to lazy-load: ${cssUrl}`));
      };
      linkTag.href = cssUrl;

      document.head.appendChild(linkTag);
    });
  }

  /**
   *
   * Begin player playback.
   *
   * If station param is supplied, this station will be loaded into
   * the player before playback begins. Otherwise the player will begin
   * playback with the currently loaded station.
   *
   * @param {number} stationId - The station to play
   * @returns {Promise<any>} - Passed in stationId or null
   */
  play(stationId = null) {
    return clientCommunicationBridge.sendMessage('SpaPlayerInterfacePlaybackStatus', { stationId, playbackStatus: 'play' });
  }

  /**
   *
   * Pause player playback.
   *
   * @returns {Promise<any>} - Passed in stationId or null
   */
  pause() {
    return clientCommunicationBridge.sendMessage('SpaPlayerInterfacePlaybackStatus', { playbackStatus: 'pause' });
  }
}

// Export to factory to simplify standard import statements.
module.exports = function () {
  return new ClientPlayerInterface();
};
