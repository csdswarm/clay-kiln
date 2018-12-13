/**
 *
 * Tweet-post component Client.js to handle Twitter Embeds
 *
 */
'use strict';

const embedsLibraryUrl = '//platform.twitter.com/widgets.js';

class TwitterEmbeds {

  constructor() {

    /**
     *
     * If Twitter embeds library is loaded, call the embed init/setup function, process(). Else
     * mount the library.
     *
     * Even though the library automatically calls process() at some point during
     * mount, we will explicitely call process() again in the mounting <script> tag "onload" event.
     * This is in order to safeguard against race condition issues related to multiple embeds attempting
     * to mount the library at the same time (we block all but the initial mount attempts).
     *
     * NOTE: Because mounting the window.instgrm embeds library occurs asynchronously, it can
     * be mounted multiple times if you don't synchronously check if script has been inserted
     * onto the page via document.querySelector().
     *
     */
    if (window.twttr) {
      this.process();
    } else if (!document.querySelector(`script[src="${embedsLibraryUrl}"]`)) {
      this.mount();
    }

  }

  /**
   *
   * Synchronously include Instagram embeds library on page.
   *
   * Note that there is no need to call this.process() after because the twitter
   * post init code is automatically called by the library when it finishes loading.
   *
   */
  mount() {
    const firstScript = document.getElementsByTagName('script')[0],
      newScript = document.createElement('script');

    /**
     * Because we don't know at what point process() is called internally during embeds library
     * mount, we must explicitly call process() again in onload event to prevent any race condition
     * issues related to multiple embeds trying to mount the embeds library at the same time.
     *
     * NOTE: Attaching this.process() directly to newScript.onload causes issues with the library,
     * it must be wrapped in a function.
     *
     */
    newScript.onload = () => {
      this.process();
    };
    newScript.src = embedsLibraryUrl;

    firstScript.parentNode.insertBefore(newScript, firstScript);
  }

  /**
   *
   * If Twitter library is already loaded, call twitter post init/setup code.
   *
   */
  process() {
    window.twttr.widgets.load();
  }

};

/**
 *
 * Client.js factory
 *
 * The following exported factory will be called ONCE FOR EACH INSTANCE of this clay component
 * in the page layout ON INITIAL PAGELOAD and ON EACH SUBSEQUENT SPA "PAGEVIEW."
 *
 * See: https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/186417174/Components
 *
 * @param {string} el - String the contains the HTML associated with this component.
 * @returns {function} Factory that will be called as described above.
 */
module.exports = el => new TwitterEmbeds(el);
