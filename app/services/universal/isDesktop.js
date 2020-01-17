'use strict';

const MEDIUM_SCREEN_WIDTH = 1023,
  isDesktop = () => {
    try {
      return !window.matchMedia(`(max-width: ${MEDIUM_SCREEN_WIDTH}px)`).matches;
    } catch (err) {
      // No window, not desktop
      return false;
    }
  };

module.exports = isDesktop;
