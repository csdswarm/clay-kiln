'use strict';

const MEDIUM_SCREEN_WIDTH = 1023,
  isDesktop = () => {
    return !window.matchMedia(`(max-width: ${MEDIUM_SCREEN_WIDTH}px)`).matches;
  };

module.exports = isDesktop;
