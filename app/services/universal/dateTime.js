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
   * formats a date with the give format with the ability to display the timezone
   *
   * @param {*} date - date object or integer from epoch
   * @param {string} format - format string
   * @returns {string}
   */
  formatLocal = (date, format) => {
    let dateString = moment(date).format(format);

    if (format.includes('z')) {
      dateString += ` ${usersTimeZone()}`;
    }

    return dateString;
  },
  /**
   * displays the formatted date with the ability for it to be adjusted to the users locale when using radioAPI.fetchDOM
   *
   * @param {string} date
   * @param {string} format
   * @returns {object}
   */
  userLocalDate = (date, format) =>
    new Handlebars.SafeString(`<userLocal data-date="${date}" data-format="${format}">${formatLocal(date, format)}</userLocal>`),
  /**
   * extracts the users language
   * @returns {string} the users set language
   */
  getNavigatorLanguage = () => {
    if (typeof navigator === 'undefined') {
      return 'en-US';
    }

    if (navigator.languages && navigator.languages.length) {
      return navigator.languages[0];
    }
    return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US';
  },
  /**
   * Returns an array of text/value keys that contain hours of the day and their corresponding utc value
   *
   * @returns {array}
   */
  get24Hours = () => {
    const details = [],
      currentHour = new Date().getHours();

    for (let hour = 23; hour >= 0; hour--) {
      const time = new Date(new Date().setHours(hour)).toISOString(),
        text = moment(time).startOf('hour').format('h:mm A'),
        value = parseInt(time.split('T')[1].split(':')[0]);

      details.push({
        text,
        value,
        selected: hour === currentHour
      });
    }

    return details;
  },
  /**
   * extracts the users timezone
   * @returns {string} the users locale timezone
   */
  usersTimeZone = () => {
    const dateArray = new Date().toLocaleTimeString(getNavigatorLanguage(),{timeZoneName:'short'}).split(' ');

    return dateArray.pop();
  },
  /**
   * Returns an array of text/value keys starting from the users current day with 7 days
   *
   * @param {boolean} [reverse]
   * @returns {array}
   */
  nextSevenDays = (reverse) => {
    const details = [],
      lang = getNavigatorLanguage(),
      today = new Date();

    // starting with today, add a week of days using the users locale
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(new Date().setDate(today.getDate() + (reverse ? offset * -1 : offset)));

      details.push({ text: day.toLocaleString(lang, {  weekday: 'long' }), value: apiDayOfWeek(day.getDay()) });
    }

    return details;
  };

module.exports.getTime = getTime;
module.exports.currentlyBetween = currentlyBetween;
module.exports.apiDayOfWeek = apiDayOfWeek;
module.exports.formatUTC = formatUTC;
module.exports.userLocalDate = userLocalDate;
module.exports.formatLocal = formatLocal;
module.exports.nextSevenDays = nextSevenDays;
module.exports.usersTimeZone = usersTimeZone;
module.exports.get24Hours = get24Hours;



