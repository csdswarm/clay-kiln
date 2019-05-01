'use strict';

/**
 * Returns the state object from the Spa
 *
 * @returns {Object}
 */
const getSpaState = () => {
    return window.vueApp ? window.vueApp.$store.state : {};
  },
  /**
   * Returns the locals required for the rendering of the html in clay
   *
   * @param {Object} [state]
   * @returns {Object}
   */
  getLocals = (state = getSpaState()) => {
    return {
      currentlyPlaying: state.spaPayloadLocals ? state.spaPayloadLocals.currentlyPlaying : {},
      radiumUser: { favoriteStations: state.user ? state.user.favoriteStations : [] }
    };
  };

module.exports.getLocals = getLocals;
