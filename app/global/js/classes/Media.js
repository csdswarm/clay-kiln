'use strict';

// Polyfill
require('intersection-observer');
let availableMedia = [];

const { isMobileWidth } = require('../../../services/client/mobile'),
  clearAvailableMedia = () => {
    // cleanup Listener
    document.removeEventListener('dismount', clearAvailableMedia);

    availableMedia = availableMedia.filter(media => media.persistent);
  },
  callbacks = {},
  defaultOptions = {
    script: null,
    callback: null,
    config: {}
  };
window.availableMedia = availableMedia;
class Media {
  /**
   * @param {Element} component
   * @param {string | object} [options]
   */
  constructor(component, options) {
    console.log('OPTIONS', options)
    return;
    if (!options || typeof options === 'string') {
      options = {
        ...defaultOptions,
        script: options
      };
    }

    // listen to the global page dismount to clear out the medias
    if (availableMedia.length === 0) {
      // Listener for dismount to delete medias
      document.addEventListener('dismount', clearAvailableMedia);
    }

    if (options.script && (!options.callback || callbacks[options.callback] !== 'COMPLETE')) {
      const s = document.createElement('script');

      s.src = options.script;

      if (options.callback) {
        console.log('CALLBACK', options.callback, callbacks)
        // hold on to all calls because there could be multiple before the callback runs
        if (!callbacks[options.callback]) {
          callbacks[options.callback] = [];
        }
        callbacks[options.callback].push({component, config: options.config, instance: this})

        window[options.callback] = () => this.processCallbacks(options.callback);
      } else {
        // Call a function to process the media once media's JavaScript loaded
        s.onload = () => this.onLoad(component, options.config);
      }

      // Add the script tag
      document.head.appendChild(s);
    } else {
      this.onLoad(component, options.config);
    }
  }
  /**
   * run all callbacks that have been added
   *
   * @param {string} key
   */
  processCallbacks(key) {
    console.log('callbacks', key, callbacks[key])
    callbacks[key].forEach(item => item.instance.onLoad(item.component, item.config));
    callbacks[key] = 'COMPLETE';
  }
  /**
   * process the media once it is ready
   *
   * @param {Element} component
   * @param {object} [options]
   */
  onLoad(component, options) {
    console.log('ONLOAD')
    const mediaObserver = new IntersectionObserver(this.mediaIsInView.bind(this), {threshold: 0}),
      { id, media, node, persistent } = this.createMedia(component, options),
      eventTypes = this.getEventTypes();

    this.id = id;
    this.media = media;
    this.node = node;
    this.persistent = Boolean(persistent);
    this.isPlaying = false;

    // Observe media for if it goes out of view
    mediaObserver.observe(node);

    // When a media begins playing trigger a stop on all others on page (must track media and ad events)
    this.addEvent(eventTypes.MEDIA_PLAY, () => { this.setPlaying(); this.pauseOtherActiveMedia(); });
    this.addEvent(eventTypes.AD_PLAY, () => this.pauseOtherActiveMedia());
    if (eventTypes.MEDIA_VOLUME) {
      this.addEvent(eventTypes.MEDIA_VOLUME, () => this.pauseOtherActiveMedia());
    }

    // autoplay muted else pause for videos
    if (this.getType() === 'video') {
      this.addEvent(eventTypes.MEDIA_READY, async () => {
        if (!isMobileWidth() && node.closest('.body__header .lead')) {
          await this.mute();
          await this.play();
        } else {
          // in case media wants to autoplay
          await this.pause();
          await this.unmute();
        }
      });
    }

    // Once completely setup, add it to the list of media on the page
    availableMedia.push(this);
  }
  /**
   * set the base type of media
   *
   * @param {string} type
   */
  setType(type) {
    this.type = type;
  }
  /**
   * get the base type of media
   *
   * @return {string}
   */
  getType() {
    return this.type;
  }
  /**
   * Construct the media (needs to be overridden)
   *
   * @param {Element} component
   * @param {object} [options]
   * @return {object}
   */
  // eslint-disable-next-line no-unused-vars
  createMedia(component, options) {
    return { id: component.id, media: component.media, node: component.node, persistent: component.persistent };
  }
  /**
   * Returns the node
   *
   * @return {object}
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
   */
  addEvent(type, listener) {
    this.getMedia().addEventListener(type, listener);
  }
  /**
   * Check if the media has gone out of view
   *
   * @param {array} changes
   */
  mediaIsInView(changes) {
    changes.forEach(change => {
      if (change.intersectionRatio === 0) {
        console.log('media', this)
        this.pause();
      }
    });
  }
  /**
   * Pause the media (can be overridden)
   */
  async pause() {
    console.log('MEDIA PAUSE', this.media)
    await this.getMedia().pause();
  }
  /**
   * start the media (can be overridden)
   */
  async play() {
    console.log('MEDIA PLAY', this.media)
    await this.getMedia().play();
  }
  /**
   * mute the media (can be overridden)
   */
  async mute() {
    console.log('media mute', this.media)
    this.getMedia().muted = true;
  }
  /**
   * unmute the media (can be overridden)
   */
  async unmute() {
    console.log('media unmute', this.media)
    this.getMedia().muted = false;
  }
  /**
   * Loop over all medias on page and pause them if it's not the media in question
   */
  pauseOtherActiveMedia() {
    // TODO ONLY DO THIS IF IT IS ACTUALLY PLAYING?
    if (this.isPlaying) {
      const excludeMediaId = this.getMediaId();
      console.log('PAUSE ALL:')
      // Loop over all media on the current page
      availableMedia.forEach((mediaOnPage) => {
        if (excludeMediaId !== mediaOnPage.id) {
          mediaOnPage.pause();
        }
      });
    }
  }
  /**
   * Loop over all medias on page and pause them if it's not the media in question
   */
  setPlaying() {
    //? not sure
    // Loop over all media on the current page
    availableMedia.forEach((mediaOnPage) => {
      if (this.getMediaId() !== mediaOnPage.id) {
        mediaOnPage.isPlaying = true;
      } else {
        mediaOnPage.isPlaying = false;
      }
    });
  }
}

module.exports = Media;
