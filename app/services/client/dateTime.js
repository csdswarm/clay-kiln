'use strict';

const { apiDayOfWeek } = require('../../services/universal/dateTime'),
  /**
   * extracts the users language
   * @returns {string} the users set language
   */
  getNavigatorLanguage = () => {
    if (navigator.languages && navigator.languages.length) {
      return navigator.languages[0];
    }
    return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US';
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
   * Returns an array of text/value keys starting the users current day with 7 days
   *
   * @returns {array}
   */
  nextSevenDays = () => {
    const details = [],
      lang = getNavigatorLanguage(),
      today = new Date();

    // starting with today, add a week of days using the users locale
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(new Date().setDate(today.getDate() + offset));

      details.push({ text: day.toLocaleString(lang, {  weekday: 'long' }), value: apiDayOfWeek(day.getDay()) });
    }

    return details;
  };

module.exports.nextSevenDays = nextSevenDays;
module.exports.usersTimeZone = usersTimeZone;
