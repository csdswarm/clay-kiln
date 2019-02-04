'use strict';

/*
 * Set the day of week select using the users locale language
 */
class StationSchedule {
  constructor() {
    const lang = this.getNavigatorLanguage(),
      select = document.querySelector('.station-schedule__select'),
      today = new Date();

    for (let i = 0; i < 7; i++) {
      const day = new Date(new Date().setDate(today.getDate() + i));

      select.add(new Option(day.toLocaleString(lang, {  weekday: 'long' }), ((day.getDay() - 7) % 7 + 7) % 8));
    }
  }

  getNavigatorLanguage() {
    if (navigator.languages && navigator.languages.length) {
      return navigator.languages[0];
    }
    return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US';
  }

}

module.exports = new StationSchedule();
