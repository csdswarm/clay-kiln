'use strict';

const
  _bindAll = require('lodash/bindAll'),
  doc = document,
  componentName = 'podcast-lead';

let
  $;

/**
 * controller class for the client side component
 */
class PodcastLeadComponentController {
  /**
   * Create a controller instantiate the view and model and add the mount listener
   */
  constructor() {
    _bindAll(this, 'onMount', 'onPlaybackStateChange');
    doc.addEventListener(`${componentName}-mount`, this.onMount);
  }
  /**
   * mounting event handler
   */
  onMount() {
    window.addEventListener('playbackStateChange', this.onPlaybackStateChange);
  }
  /**
   * handler for when the web player playback state changes
   *
   * @param {Event} e
   */
  onPlaybackStateChange(e) {
    const
      { podcastEpisodeId, playerState } = e.detail,
      targetBtn = $(`[data-play-episode="${podcastEpisodeId}"]`),
      webPlayerButton = $(`.${'image'}__play-btn`);

    if (webPlayerButton === targetBtn) {
      webPlayerButton.classList.remove('show__play');
      webPlayerButton.classList.remove('show__pause');
      webPlayerButton.classList.add(`show__${playerState === 'pause' ? 'play' : 'pause'}`);
    }
  }
}

module.exports = (el) => {
  $ = el.querySelector.bind(el); // quick alias isolated to the container el
  return new PodcastLeadComponentController(el);
};
