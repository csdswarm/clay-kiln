'use strict';

const SelectBox = require('../../services/client/selectbox'),
  { nextSevenDays } = require('../../services/universal/dateTime'),
  { fetchDOM } = require('../../services/client/radioApi');

class StationSchedule {
  constructor(el) {
    const select = el.querySelector('.day-of-week__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      category = select.getAttribute('data-category'),
      schedule = el.querySelector('.station-schedule');

    nextSevenDays().forEach((day) => select.add(new Option(day.text, day.value)));

    // eslint-disable-next-line one-var
    const selectBox = new SelectBox(select, {
      searchable: false
    });

    selectBox.addEventListener('change', (option) => this.loadContent({ stationId, gmtOffset, category }, option.value));
    this.sortShows(schedule);
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

    this.sortShows(content);
    ul.parentNode.replaceChild(content, ul);
  }
  /**
   * Sort shows elements in DOM
   *
   * @param {HTMLElement} schedule
   */
  sortShows(schedule) {
    const shows = schedule.querySelectorAll('li:not(.station-schedule__no-results)'),
      sortedShows = Array.from(shows).sort(this.sortSchedule);

    schedule.innerHTML = '';
    sortedShows.forEach(show => {
      schedule.appendChild(show);
    });
  }
  /**
   * Sorts schedule by local time, AM before PM
   *
   * @param {HTMLElement} show1
   * @param {HTMLElement} show2
   * @returns {Number}
   */
  sortSchedule(show1, show2) {
    const timeSelector = '.details__time span',
      timeSelector2 = timeSelector + ' userlocal',
      show1_start_time = (show1.querySelector(timeSelector2) || show1.querySelector(timeSelector)).innerText,
      show2_start_time = (show2.querySelector(timeSelector2) || show2.querySelector(timeSelector)).innerText;

    return new Date('1000/01/01 ' + show1_start_time) - new Date('1000/01/01 ' + show2_start_time);
  }
}

module.exports = (el) => new StationSchedule(el);
