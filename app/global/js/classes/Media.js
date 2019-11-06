'use strict';

let currentMedia = [];

const clearCurrentMedia = () => {
    currentMedia = currentMedia.filter(media => media.persistent);
  },
  callbacks = {},
  defaultOptions = {
    script: null,
    callback: null,
    type: 'Media',
    config: {},
    dontLoadScripts: false
  },
  CALLBACK_COMPLETE = 'COMPLETE';


window.currentMedia = currentMedia;

// Listener for dismount to delete medias
document.addEventListener('dismount', clearCurrentMedia);

class Media {
  /**
   * @param {Element} component
   * @param {string | object} [options]
   */
  constructor(component, options) {
    if (!options || typeof options === 'string') {
      options = {
        ...defaultOptions,
        script: options
      };
    }

    this.component = component;
    this.options = options;

    if (!options.dontLoadScripts) {
      this.loadScripts();
    }
  }

  /**
   * load the needed script tags
   */
  loadScripts() {
    if (this.options.script && (!this.options.callback || callbacks[this.options.callback] !== CALLBACK_COMPLETE)) {
      const script = document.createElement('script');

      script.src = this.options.script;

      if (this.options.callback) {
        // hold on to all calls because there could be multiple before the callback runs
        if (!callbacks[this.options.callback]) {
          callbacks[this.options.callback] = [];
        }
        callbacks[this.options.callback].push(this);

        window[this.options.callback] = () => this.processCallbacks(this.options.callback);
      } else {
        // Call a function to process the media once media's JavaScript loaded
        script.onload = () => this.whenScriptsLoaded();
      }

      // Add the script tag
      document.head.appendChild(script);
    } else {
      this.whenScriptsLoaded();
    }
  }
  /**
   * run all callbacks that have been added and mark this callback has having been run
   *
   * @param {string} key
   */
  processCallbacks(key) {
    callbacks[key].forEach(item => item.whenScriptsLoaded());
    callbacks[key] = CALLBACK_COMPLETE;
  }
  /**
   * process the media once the scripts have been loaded
   */
  async whenScriptsLoaded() {
    const { component } = this,
      { id, media, node, persistent } = await this.createMedia(component),
      mediaObserver = new IntersectionObserver((change) => this.notInView(change), { threshold: 0 });

    this.id = id;
    this.media = media;
    this.node = node;
    this.persistent = Boolean(persistent);
    this.lead = Boolean(this.node.closest('.body__header .lead'));

    // Observe media for if it goes out of view
    mediaObserver.observe(this.getNode());

    this.prepareMedia();

    // Once setup, add it to the list of media on the page
    currentMedia.push(this);
  }
  /**
   * add the events to pause media when required
   *
   */
  prepareMedia() {
    const eventTypes = this.getEventTypes();

    // When a media begins playing trigger a stop on all others on page (must track media and ad events)
    this.addEvent(eventTypes.MEDIA_PLAY, () => this.pauseOtherActiveMedia());
    if (eventTypes.AD_PLAY) {
      this.addEvent(eventTypes.AD_PLAY, () => this.pauseOtherActiveMedia());
    }
  }
  /**
   * Returns the node
   *
   * @return {Element}
   */
  getNode() {
    return this.node;
  }
  /**
   * Returns the media
   *
   * @return {object}
   */
  getMedia() {
    return this.media;
  }
  /**
   * Returns the id of media
   *
   * @return {string}
   */
  getMediaId() {
    return this.id;
  }
  /**
   * Check if the media has gone out of view
   *
   * @param {array} changes
   */
  notInView(changes) {
    changes.forEach(change => {
      if (change.intersectionRatio === 0) {
        this.pause();
      }
    });
  }
  /**
   * Loop over all media on page and pause them if it's not this media
   */
  pauseOtherActiveMedia() {
    const excludeMediaId = this.getMediaId();

    // Loop over all media on the current page
    currentMedia.forEach((mediaOnPage) => {
      if (excludeMediaId !== mediaOnPage.id) {
        mediaOnPage.pause();
      }
    });
  }
  /**
   * helper method to log if debugging is enabled for this instance
   */
  log() {
    if (this.options.debug) {
      console.log('%c %s', 'color: green', '-'.repeat(100));
      console.log.apply(this, arguments);
    }
  }
  /**
   * Construct the media (must to be overridden)
   *
   * @param {Element} component
   * @return {object}
   */
  createMedia(component) {
    return { id: component.id, media: component.media, node: component.node, persistent: component.persistent };
  }
  /**
   * Returns the event types for the media (can be overridden)
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      MEDIA_PLAY: 'play',
      MEDIA_PAUSE: 'pause',
      MEDIA_VOLUME: 'volume',
      MEDIA_READY: 'ready',
      AD_PLAY: 'ad_play',
      AD_VOLUME: 'ad_volume'
    };
  }
  /**
   * adds an event for the specific media type (can be overridden)
   *
   * @param {string} type
   * @param {function} listener
   * @param {object} [options]
   */
  addEvent(type, listener, options) {
    this.getMedia().addEventListener(type, listener, options);
  }
  /**
   * Pause the media (can be overridden)
   */
  async pause() {
    await this.getMedia().pause();
  }
  /**
   * start the media (can be overridden)
   */
  async play() {
    await this.getMedia().play();
  }
  /**
   * mute the media (can be overridden)
   */
  async mute() {
    this.getMedia().muted = true;
  }
  /**
   * unmute the media (can be overridden)
   */
  async unmute() {
    this.getMedia().muted = false;
  }
  /**
   * determines if the media is in the lead position
   *
   * @return {Boolean}
   */
  isLead() {
    return this.lead;
  }
}

module.exports = Media;
