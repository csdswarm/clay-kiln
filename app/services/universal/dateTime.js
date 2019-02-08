'use strict';

/**
 * Returns the time from epoch defaulting to the server time if a specific time is not passed in
 *
 * @param {string} [string]
 * @returns {number}
 */
const getTime = (string) => {
    const now = new Date();

    if (string) {
      const arr = string.split(':');

      now.setUTCHours(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]));
    }

    return now.getTime();
  },
  /**
   * Returns a boolean if the start and end date is between the current time
   *
   * @param {string} start
   * @param {string} end
   * @returns {boolean}
   */
  currentlyBetween = (start, end) => {
    const now = getTime();

    return getTime(start) <= now && getTime(end) > now;
  };

module.exports.getTime = getTime;
module.exports.currentlyBetween = currentlyBetween;
