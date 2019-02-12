'use strict';

const Selectr = require('mobius1-selectr'),
  { nextSevenDays, usersTimeZone } = require('../../services/client/dateTime'),
  { fetchDOM } = require('../../services/client/radioApi');

/*
 * Set the day of week select using the users locale language
 */
class StationSchedule {
  constructor(el) {
    this.timeZone = usersTimeZone();

    const select = el.querySelector('.day-of-week__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      category = select.getAttribute('data-category'),
      ul = el.querySelector('.station-schedule');

    nextSevenDays().forEach((day) => select.add(new Option(day.text, day.value)));

    // eslint-disable-next-line one-var
    const selectr = new Selectr(select, {
      searchable: false
    });

    // iOS crashes when method is directly called, using setTimeout to put it on a different thread fixes it
    selectr.on('selectr.change', (option) => setTimeout(() => this.loadContent({ stationId, gmtOffset, category }, option.value)), 0);

    this.showTimeZone(ul);
  }
  /**
   @typedef {object} StationDetails
   @property {number} stationId
   @property {number} gmtOffset
   @property {string} category
  */
  /**
   * load in new content from the api
   * @param {StationDetails} stationDetails
   * @param {int} dayOfWeek
   * @returns {Promise}
   */
  async loadContent(stationDetails, dayOfWeek) {
    const
      endpoint = `//${window.location.hostname}/_components/station-schedule/instances/default.html`,
      doc = await fetchDOM(`${endpoint}?stationId=${stationDetails.stationId}&gmt_offset=${stationDetails.gmtOffset}&category=${stationDetails.category}&dayOfWeek=${dayOfWeek}`),
      content = doc.querySelector('.station-schedule'),
      ul = document.querySelector('.station-schedule');

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

module.exports = (el) => new StationSchedule(el);
