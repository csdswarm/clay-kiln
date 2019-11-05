'use strict';

/**
 *
 * Returns the class that represents the playing icon for a station
 *
 * @param {Object} locals
 * @param {Number} stationId
 * @returns {String} - the class to display
 */
const playingClass = (locals, stationId) => {
    return locals.currentlyPlaying && locals.currentlyPlaying.id === stationId ? locals.currentlyPlaying.playingClass : 'show__play';
  },
  /**
   *
   * Returns the class that represents the favorite icon for a station
   *
   * @param {Object} locals
   * @param {Number} stationId
   * @returns {String} - the class to display
   */

  favoriteClass = (locals, stationId) => {
    const favorites = locals.radiumUser && locals.radiumUser.favoriteStations;

    return favorites && favorites.includes(stationId) ? '--active' : '--not-active';
  };

module.exports.playingClass = playingClass;
module.exports.favoriteModifier = favoriteClass;
