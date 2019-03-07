'use strict';

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
      parallelPromises = [];
    
    // Load independent player resources in parallel.
    parallelPromises.push(this.lazyLoadCssResource(`//${window.location.hostname}${webPlayerHost}/radio-player.min.css`));
    parallelPromises.push(this.lazyLoadJsResource(`//${window.location.hostname}${webPlayerHost}/radio-player.min.js`));
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

  initPlayerGoogleTags() {
    // Set up google tag in case it doesn't exist
    const googletag = googletag || {};

    googletag.cmd = googletag.cmd || [];
    // Slot for 100x35 on web player
    // TODO: add slot in more coherent way
    googletag.cmd.push(() => {
      googletag.defineSlot('/21674100491/ENT.TEST', [100, 35], 'div-gpt-ad-1532458744047-0').addService(googletag.pubads());
      googletag.display('div-gpt-ad-1532458744047-0');
    });
  }

}

module.exports = ClientPlayerInterface;
