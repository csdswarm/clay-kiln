'use strict';

const
  /**
   * Returns the locals required for the rendering of the html in clay
   *
   * @param {Object} state
   * @returns {Object}
   */
  getLocals = (state) => {
    return {
      currentlyPlaying: state.spaPayloadLocals ? state.spaPayloadLocals.currentlyPlaying : {}
    };
  };

module.exports.getLocals = getLocals;
