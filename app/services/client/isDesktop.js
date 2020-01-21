'use strict';

const { SERVER_SIDE } = require('../universal/constants'),
  MEDIUM_SCREEN_WIDTH = 1023,
  isDesktop = () => {
    if (SERVER_SIDE) {
      return !window.matchMedia(`(max-width: ${MEDIUM_SCREEN_WIDTH}px)`).matches;
    } else {
      // Node context, not desktop
      return false;
    }
  };

module.exports = isDesktop;
