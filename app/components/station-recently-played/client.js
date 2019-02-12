'use strict';

const Selectr = require('mobius1-selectr'),
  { nextSevenDays, usersTimeZone } = require('../../services/client/dateTime');

/*
 * Set the day of week select using the users locale language
 */
class StationRecentlyPlayed {
  constructor(el) {
    this.timeZone = usersTimeZone();

    const select = el.querySelector('.day-of-week__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      ul = el.querySelector('.station-recently-played');

    nextSevenDays().forEach((day) => select.add(new Option(day.text, day.value)));

    // eslint-disable-next-line one-var
    const selectr = new Selectr(select, {
      searchable: false
    });

    selectr.on('selectr.change', (option) => this.loadContent(stationId, gmtOffset, option.value));

    this.showTimeZone(ul);
  }
  /**
   * load in new content from the api
   * @param {number} stationId
   * @param {number} gmtOffset
   * @param {number} dayOfWeek
   * @returns {Promise}
   */
  async loadContent(stationId, gmtOffset, dayOfWeek) {
    // Initialize the DOM parser and set the HTML from the API call of the station-recently-played
    const parser = new DOMParser(),
      endpoint = `//${window.location.hostname}/_components/station-recently-played/instances/default.html`,
      response = await fetch(`${endpoint}?stationId=${stationId}&dayOfWeek=${dayOfWeek}&gmt_offset=${gmtOffset}&ignore_resolve_media=true`),
      html = await response.text(),
      doc = parser.parseFromString(html, 'text/html'),
      content = doc.querySelector('.station-recently-played'),
      ul = document.querySelector('.station-recently-played');

    this.showTimeZone(content);
    ul.parentNode.replaceChild(content, ul);
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

module.exports = (el) => new StationRecentlyPlayed(el);
