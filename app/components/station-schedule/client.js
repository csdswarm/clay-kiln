'use strict';

const SelectBox = require('../../services/client/selectbox'),
  { nextSevenDays } = require('../../services/universal/dateTime'),
  { fetchDOM } = require('../../services/client/radioApi');

class StationSchedule {
  constructor(el) {
    const select = el.querySelector('.day-of-week__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      category = select.getAttribute('data-category');

    nextSevenDays().forEach((day) => select.add(new Option(day.text, day.value)));

    // eslint-disable-next-line one-var
    const selectBox = new SelectBox(select, {
      searchable: false
    });

    selectBox.addEventListener('change', (option) => this.loadContent({ stationId, gmtOffset, category }, option.value));
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

    ul.parentNode.replaceChild(content, ul);
  }
}

module.exports = (el) => new StationSchedule(el);
