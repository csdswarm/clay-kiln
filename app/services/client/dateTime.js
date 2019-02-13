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
   * Returns an array of text/value keys that contain times of the day for a select dropdown
   *
   * @returns {array}
   */
  todaysTimes = () => {
    const details = [],
    clockHours = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    for (let [index, hour] of Object.entries(clockHours)) {
      const displayHour = `${hour % 12 + 1}:00 ${index < 12 ? 'AM' : 'PM'}`;
      details.push({ text: displayHour, value: index });
    }

    return details;
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
module.exports.todaysTimes = todaysTimes;
module.exports.usersTimeZone = usersTimeZone;
