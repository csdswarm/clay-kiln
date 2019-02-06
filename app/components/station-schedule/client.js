'use strict';

/*
 * Set the day of week select using the users locale language
 */
class StationSchedule {
  constructor(el) {
    this.lang = StationSchedule.getNavigatorLanguage();
    this.select = el.querySelector('.station-schedule__select');
    this.ul = el.querySelector('.station-schedule');
    this.today = new Date();

    // starting with today, add a week of days using the users locale
    for (let i = 0; i < 7; i++) {
      const day = new Date(new Date().setDate(this.today.getDate() + i)),
        dayOfWeek = ((day.getDay() - 7) % 7 + 7) % 8,
        option = new Option(day.toLocaleString(this.lang, {  weekday: 'long' }), dayOfWeek);

      option.classList.add('select__option');
      this.select.add(option);
    }

    this.select.addEventListener('change', (el) => StationSchedule.loadContent(el, this.ul));
  }
  /**
   * @param {object} event
   * @param {object} ul
   * @returns {Promise}
   */
  static async loadContent(event, ul) {
    // Initialize the DOM parser and set the HTML from the API call of the station-schedule
    const parser = new DOMParser(),
      endpoint = `//${window.location.hostname}/_components/station-schedule/instances/default.html`,
      response = await fetch(`${endpoint}?stationId=${event.target.getAttribute('data-station-id')}&dayOfWeek=${event.target.value}&gmt_offset=${event.target.getAttribute('data-gmt-offset')}`),
      html = await response.text(),
      doc = parser.parseFromString(html, 'text/html');

    ul.innerHTML = doc.querySelector('#station-schedule').innerHTML;
  }
  /**
   * @returns {string} the users set language
   */
  static getNavigatorLanguage() {
    if (navigator.languages && navigator.languages.length) {
      return navigator.languages[0];
    }
    return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US';
  }
}

module.exports = (el) => new StationSchedule(el);
