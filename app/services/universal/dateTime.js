'use strict';

const moment = require('moment'),
  Handlebars = require('handlebars'),
  /**
   * Returns the time from epoch defaulting to the server time if a specific time is not passed in
   *
   * @param {string} [string]
   * @returns {number}
   */
  getTime = (string) => {
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
  },
  /**
   * Converts javascript day (0=Sunday, 6=Saturday) to api day (1=Monday, 7=Sunday)
   *
   * @param {number} day
   * @returns {number}
   */
  apiDayOfWeek = (day) => ((day - 7) % 7 + 7) % 8,
  /**
   * Takes a date and returns a formatted string in iso8601 format (YYYY-MM-DDTHH:MM:SS.NNNZ)
   *
   * @param {*} date - date object or integer from epoch
   * @returns {string}
   */
  formatUTC = (date) => `${moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
  /**
   * displays the formatted date with the ability for it to be adjusted to the users locale when using radioAPI.fetchDOM
   *
   * @param {string} date
   * @param {string} format
   * @returns {object}
   */
  userLocalDate = (date, format) =>
    new Handlebars.SafeString(`<userLocal data-date="${date}" data-format="${format}">${moment(date).format(format)}</userLocal>`);

module.exports.getTime = getTime;
module.exports.currentlyBetween = currentlyBetween;
module.exports.apiDayOfWeek = apiDayOfWeek;
module.exports.formatUTC = formatUTC;
module.exports.userLocalDate = userLocalDate;



