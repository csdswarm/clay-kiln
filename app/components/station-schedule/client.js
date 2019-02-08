'use strict';

/*
 * Set the day of week select using the users locale language
 */
class StationSchedule {
  constructor(el) {
    this.timeZone = this.usersTimeZone();

    const lang = this.getNavigatorLanguage(),
      select = el.querySelector('.station-schedule__select'),
      ul = el.querySelector('.station-schedule'),
      today = new Date();

    // starting with today, add a week of days using the users locale
    for (let i = 0; i < 7; i++) {
      const day = new Date(new Date().setDate(today.getDate() + i)),
        dayOfWeek = ((day.getDay() - 7) % 7 + 7) % 8,
        option = new Option(day.toLocaleString(lang, {  weekday: 'long' }), dayOfWeek);

      option.classList.add('select__option');
      select.add(option);
    }

    this.showTimeZone(ul);
    select.addEventListener('change', (el) => this.loadContent(el));
  }
  /**
   * load in new content from the api
   * @param {Event} event
   * @returns {Promise}
   */
  async loadContent(event) {
    // Initialize the DOM parser and set the HTML from the API call of the station-schedule
    const parser = new DOMParser(),
      endpoint = `//${window.location.hostname}/_components/station-schedule/instances/default.html`,
      response = await fetch(`${endpoint}?stationId=${event.target.getAttribute('data-station-id')}&dayOfWeek=${event.target.value}&gmt_offset=${event.target.getAttribute('data-gmt-offset')}&ignore_resolve_media=true`),
      html = await response.text(),
      doc = parser.parseFromString(html, 'text/html'),
      content = doc.querySelector('.station-schedule'),
      ul = document.querySelector('.station-schedule');

    this.showTimeZone(content);
    ul.parentNode.replaceChild(content, ul);
  }
  /**
   * extracts the users language
   * @returns {string} the users set language
   */
  getNavigatorLanguage() {
    if (navigator.languages && navigator.languages.length) {
      return navigator.languages[0];
    }
    return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US';
  }
  /**
   * extracts the users timezone
   * @returns {string} the users locale timezone
   */
  usersTimeZone() {
    const dateArray = new Date().toLocaleTimeString(this.getNavigatorLanguage(),{timeZoneName:'short'}).split(' ');

    return dateArray.pop();
  }
  /**
   * adds the users timezone to the times displayed
   * @param {Element} ul
   */
  showTimeZone(ul) {
    const times = ul.querySelectorAll('.details__time');

    times.forEach((time) => {
      if (/\d/.test(time.innerText)) {
        time.appendChild(document.createTextNode(this.timeZone));
      }
    });
  }
}

module.exports = (el) => new StationSchedule(el);
