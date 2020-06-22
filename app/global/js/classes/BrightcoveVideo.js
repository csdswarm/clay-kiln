'use strict';

// Polyfill
require('core-js/modules/es6.symbol');
const { defer } = require('../../../services/universal/promises'),
  _get = require('lodash/get'),
  Video = require('./Video'),
  clientCommunicationBridge = require('../../../services/client/ClientCommunicationBridge')(),
  scriptLoadedPromises = [],
  loadedPlayers = [];

class BrightcoveVideo extends Video {
  /**
   * @override
   */
  constructor(brightcoveComponent) {
    const videoPlayer = brightcoveComponent.querySelector('video-js'),
      brightcoveAccount = videoPlayer.getAttribute('data-account'),
      brightcovePlayerId = videoPlayer.getAttribute('data-player'),
      videoPlayerCloseBtn = brightcoveComponent.querySelector('.player__video-close-btn');

    super(brightcoveComponent, {
      script: `//players.brightcove.net/${brightcoveAccount}/${brightcovePlayerId}_default/index.min.js`,
      dontLoadScripts: true
    });

    this.deferredScriptLoaded = defer();

    // wait for all other BC videos on the page to load first
    Promise.all(scriptLoadedPromises).then(() => {
      if (loadedPlayers.includes(brightcovePlayerId)) {
        // the script has already been loaded
        this.whenScriptsLoaded();
        this.deferredScriptLoaded.resolve();
      } else {
        // load the scripts like normal
        this.loadScripts();
        loadedPlayers.push(brightcovePlayerId);
      }
    });

    // add our load promise to the queue so other BC videos wait
    scriptLoadedPromises.push(this.deferredScriptLoaded.promise);

    this.videoPlayerWrapper = brightcoveComponent.querySelector('.player__video');
    this.webPlayerPlaybackState = clientCommunicationBridge.getLatest('ClientWebPlayerPlaybackStatus', {}).playerState;

    clientCommunicationBridge.subscribe('ClientWebPlayerPlaybackStatus', async ({ playerState }) => {
      this.webPlayerPlaybackState = playerState;
      if (this.webPlayerPlaybackState === 'play') {
        this.hideStickyPlayer();
      }
    });

    // add handler for closing the stick player
    videoPlayerCloseBtn.addEventListener('click', () => this.onCloseStickyPlayer());
  }
  /**
   * @override
   */
  createMedia(component) {
    const video = component.querySelector('video-js'),
      id = video.getAttribute('id'),
      media = bc(id),
      node = component;

    this.autoplayUnmuted = video.getAttribute('data-autoplay-unmuted') === 'true';
    this.clickToPlay = video.getAttribute('data-click-to-play') === 'true';

    return { id, media, node };
  }
  /**
   * @override
   */
  prepareMedia() {
    super.prepareMedia();

    this.addEvent(this.getEventTypes().MEDIA_PLAY, () => {
      this.active = true;
    });

    this.addEvent(this.getEventTypes().MEDIA_READY, () => {
      // mark this video as done so the next one can load
      this.deferredScriptLoaded.resolve();
    });
    // add overlay
    this.addOverlay();
  }
  /**
   * @override
   */
  getEventTypes() {
    return {
      MEDIA_PLAY: 'play',
      MEDIA_PAUSE: 'pause',
      MEDIA_READY: 'loadstart',
      AD_PLAY: 'ads-play',
      MEDIA_VOLUME: 'volumechange',
      AD_VOLUME: 'ads-volumechange'
    };
  }
  /**
   * use the brightcove event listener
   *
   * @override
   */
  addEvent(type, listener, options) {
    if (options && options.once) {
      this.getMedia().one(type, listener);
    } else {
      this.getMedia().on(type, listener);
    }
  }
  /**
   * @override
   */
  async play() {
    if (this.autoplayUnmuted) {
      await this.getMedia().muted(false);
    }
    await this.getMedia().play();
  }
  /**
   * @override
   */
  async pause() {
    this.active = false;
    this.hideStickyPlayer();
    await super.pause();
  }
  /**
   * @override
   */
  async mute() {
    await this.getMedia().muted(true);
  }
  /**
   * @override
   */
  async unmute() {
    // only unmute if the user has actually interacted with the player
    if (this.userInteracted()) {
      await this.getMedia().muted(false);
    }
  }
  /**
   * show brightcove sticky player if web player is paused or not on page
   *
   * @return {Boolean}
   */
  showStickyPlayer() {
    if (clientCommunicationBridge.getLatest('ClientWebPlayerMountPlayer')) {
      this.videoPlayerWrapper.classList.add('web-player-exists');
    }
    if (this.webPlayerPlaybackState !== 'play') {
      // ensure that the height is retained
      this.getNode().style.minHeight = `${this.videoPlayerWrapper.offsetHeight}px`;
      this.videoPlayerWrapper.classList.add('player__video--out-of-view');
      return true;
    }

    return false;
  }
  /**
   * hide the brightcove sticky player
   */
  hideStickyPlayer() {
    // remove the min height
    this.getNode().style.minHeight = 'initial';
    this.videoPlayerWrapper.classList.remove('player__video--out-of-view');
  }
  /**
   * @override
   *
   * Check if the video has gone out of view only when not sticky
   * if web player is paused or not on page
   */
  notInView(changes) {
    let stuck = false;

    changes.forEach(change => {
      if (change.intersectionRatio === 0 && this.active) {
        stuck = this.showStickyPlayer();
      } else {
        this.hideStickyPlayer();
      }
    });
    if (!stuck) {
      super.notInView(changes);
    }
  }
  /**
   * @override
   */
  userInteracted() {
    return this.getMedia().userActive();
  }
  /**
   * @override
   */
  shouldAutoplay() {
    return !this.clickToPlay && super.shouldAutoplay();
  }

  /**
   * If the player has high_level_category of SPORTS add overlay
   * @function
   */
  addOverlay() {
    videojs.getPlayer(this.id).ready( function () {
      const myPlayer = this;

      myPlayer.on('loadstart', function () {
        const highLevelCategory = _get(myPlayer, 'mediainfo.customFields.high_level_category');

        if (!highLevelCategory) {
          return; // short circuit if not needed
        }
        // check to see if this is a sports video
        if (highLevelCategory === 'SPORTS') {
          // add the overlay
          myPlayer.overlay({
            class: 'rdc-overlay',
            overlays: [{
              content: `
                <a href="https://app.radio.com/brightcove-video-player-overlay" target="_blank" class="rdc-overlay__link">
                  <div class="rdc-overlay__logo"></div>
                  <div class="rdc-overlay__text"> Download the RADIO.COM app <span class="rdc-overlay__caret"></span></div>
                </a>
                <div class="rdc-overlay__close"></div>
              `,
              start: 20,
              end: 30
            }]
          });

          // close btn
          const overlayCloseBtn = myPlayer.el_.querySelector('.rdc-overlay__close');

          myPlayer.onRdcClose = e => {
            // this is to make it semi-permanent as in it would require a refresh or page change
            e.target.parentElement.style.display = 'none';
            overlayCloseBtn.removeEventListener('click', myPlayer.onRdcClose);
          };

          overlayCloseBtn.addEventListener('click', myPlayer.onRdcClose);
        }
      });
    });
  }

  /**
   * handler for closing the sticky player
   * @function
   */
  onCloseStickyPlayer() {
    this.pause();
  }
}

module.exports = BrightcoveVideo;
