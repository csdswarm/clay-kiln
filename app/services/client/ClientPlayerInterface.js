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
      brightcoveAccountId = webPlayerComponentDiv.dataset.brightcoveAccountId,
      parallelPromises = [],
      webPlayerEnv = this.getWebPlayerEnvironment();

    // Load independent player resources in parallel.
    parallelPromises.push(this.lazyLoadCssResource(`${webPlayerHost}${webPlayerEnv}/radio-player.min.css`));
    parallelPromises.push(this.lazyLoadJsResource(`${webPlayerHost}${webPlayerEnv}/radio-player.min.js`));
    parallelPromises.push(this.lazyLoadJsResource(`//players.brightcove.net/${brightcoveAccountId}/default_default/index.min.js`));

    return Promise.all(parallelPromises)
      .then(() => {
        // Load dependent resource after.
        return this.lazyLoadJsResource('//players.brightcove.net/videojs-ima3/3/videojs.ima3.min.js');
      })
      .then(() => {
        // Initialize Player Google tags
        this.initPlayerGoogleTags();
      });
    
  }

  /**
   *
   * Load different player library depending on environment.
   *
   * @returns {string} - The web player environment namespace.
   */
  getWebPlayerEnvironment() {
    if (window.location.search && window.location.search.includes('webplayer-dev')) {
      return '-dev';
    } else if (window.location.search && window.location.search.includes('webplayer-stg')) {
      return '-stg';
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
   * Set up the google ad slot in the player
   */
  initPlayerGoogleTags() {
    // Set up google tag in case it doesn't exist
    const googletag = googletag || {};

    googletag.cmd = googletag.cmd || [];
    // Slot for 100x35 on web player
    // TODO: add slot in more coherent way
    googletag.cmd.push(() => {
      googletag.defineSlot('/21674100491/NTL.RADIO', [100, 35], 'div-gpt-ad-1532458744047-0').addService(googletag.pubads());
      googletag.display('div-gpt-ad-1532458744047-0');
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
    return clientCommunicationBridge.sendMessage('SpaPlayerInterfacePlay', { stationId });
  }

}

module.exports = ClientPlayerInterface;
