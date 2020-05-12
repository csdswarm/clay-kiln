'use strict';

const _get = require('lodash/get'),
  /**
   * Returns the locals required for the rendering of the html in clay
   *
   * @param {Object} state
   * @returns {Object}
   */
  getLocals = (state) => {
    return {
      currentlyPlaying: _get(state, 'spaPayloadLocals.currentlyPlaying', {})
    };
  },
  /**
   * returns the loadedIds from the spa payload's locals
   * @param {object} state
   * @returns {string[]}
   */
  getLoadedIds = state => {
    return _get(state, 'spaPayloadLocals.loadedIds', []);
  };

module.exports = {
  getLocals,
  getLoadedIds
};
