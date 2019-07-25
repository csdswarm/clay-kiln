'use strict';

/**
 *
 * Get the class that represents the icon to display
 *
 * @param {Object} locals
 * @param {Number} stationId
 * @returns {String} - the class to display
 */
const playingClass = (locals, stationId) => {
  return locals.currentlyPlaying && locals.currentlyPlaying.id === stationId ? locals.currentlyPlaying.playingClass : 'show__play';
};

module.exports.playingClass = playingClass;
