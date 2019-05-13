'use strict';

// Polyfill
require('intersection-observer');
let availableMedia = [];

const clearAvailableMedia = () => {
  //TODO delete the reference from the global variable?
    availableMedia = availableMedia.filter(media => media.persistent);
    console.log('DESTROY availableMedia', availableMedia);
  },
  callbacks = {},
  defaultOptions = {
    script: null,
    callback: null,
    type: 'Media',
    config: {}
  };

// Listener for dismount to delete medias
document.addEventListener('dismount', clearAvailableMedia);

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

    this.options = options;

    if (this.options.script && (!this.options.callback || callbacks[this.options.callback] !== 'COMPLETE')) {
      const script = document.createElement('script');

      script.src = this.options.script;

      if (this.options.callback) {
        // hold on to all calls because there could be multiple before the callback runs
        if (!callbacks[options.callback]) {
          callbacks[this.options.callback] = [];
        }
        callbacks[this.options.callback].push({component, instance: this})

        window[this.options.callback] = () => this.processCallbacks(this.options.callback);
      } else {
        // Call a function to process the media once media's JavaScript loaded
        script.onload = () => this.whenMediaReady(component);
      }

      // Add the script tag
      document.head.appendChild(script);
    } else {
      this.whenMediaReady(component);
    }
  }
  /**
   * run all callbacks that have been added
   *
   * @param {string} key
   */
  processCallbacks(key) {
    callbacks[key].forEach(item => item.instance.whenMediaReady(item.component));
    callbacks[key] = 'COMPLETE';
  }
  /**
   * process the media once it is ready
   *
   * @param {Element} component
   */
  whenMediaReady(component) {
    const { id, media, node, persistent } = this.createMedia(component);

    this.id = id;
    this.media = media;
    this.node = node;
    this.persistent = Boolean(persistent);

    this.prepareMedia();
  }
  prepareMedia() {
    const mediaObserver = new IntersectionObserver(this.mediaIsNotInView.bind(this), {threshold: 0}),
      eventTypes = this.getEventTypes();

    // When a media begins playing trigger a stop on all others on page (must track media and ad events)
    this.addEvent(eventTypes.MEDIA_PLAY, () =>{ console.log('MEDIA PLAY'); this.pauseOtherActiveMedia(); });
    this.addEvent(eventTypes.AD_PLAY, () =>{ console.log('AD PLAY'); this.pauseOtherActiveMedia(); });

    // Observe media for if it goes out of view
    mediaObserver.observe(this.getNode());

    // Once completely setup, add it to the list of media on the page
    availableMedia.push(this);
    console.log('AVAIlABLE MEDIA ADDED', availableMedia);
  }
  /**
   * get the base type of media
   *
   * @return {string}
   */
  getType() {
    return this.options.type;
  }
  /**
   * Construct the media (needs to be overridden)
   *
   * @param {Element} component
   * @return {object}
   */
  createMedia(component) {
    return { id: component.id, media: component.media, node: component.node, persistent: component.persistent };
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
   * Returns the event types for the media (can be overridden)
   *
   * @return {object}
   */
  getEventTypes() {
    return {
      MEDIA_PLAY: 'play',
      MEDIA_VOLUME: 'volume',
      MEDIA_READY: 'ready',
      AD_PLAY: 'ad_play'
    };
  }
  /**
   * adds an event for the specific media type
   *
   * @param {string} type
   * @param {function} listener
   * @param {object} [options]
   */
  addEvent(type, listener, options) {
    this.getMedia().addEventListener(type, listener, options);
  }
  /**
   * Check if the media has gone out of view
   *
   * @param {array} changes
   */
  mediaIsNotInView(changes) {
    changes.forEach(change => {
      if (change.intersectionRatio === 0) {
        console.log('MEDIA NOT IN VIEW PAUSE', this)
        this.pause();
      }
    });
  }
  /**
   * Pause the media (can be overridden)
   */
  async pause() {
    // this.log('MEDIA PAUSE', this.media)
    await this.getMedia().pause();
  }
  /**
   * start the media (can be overridden)
   */
  async play() {
    // this.log('MEDIA PLAY', this.media)
    await this.getMedia().play();
  }
  /**
   * mute the media (can be overridden)
   */
  async mute() {
    // this.log('media mute', this.media)
    this.getMedia().muted = true;
  }
  /**
   * unmute the media (can be overridden)
   */
  async unmute() {
    // this.log('media unmute', this.media)
    this.getMedia().muted = false;
  }
  /**
   * Loop over all medias on page and pause them if it's not the media in question
   */
  pauseOtherActiveMedia() {
    const excludeMediaId = this.getMediaId();
    debugger;
    this.log('PAUSE ALL:', excludeMediaId)
    // Loop over all media on the current page
    availableMedia.forEach((mediaOnPage) => {
      if (excludeMediaId !== mediaOnPage.id) {
        this.log('PAUSING:', mediaOnPage.constructor.name)
        mediaOnPage.pause();
      }
    });
  }
  log() {
    if (this.options.debug) {
      console.log.apply(this, arguments);
    }
  }
}

module.exports = Media;
