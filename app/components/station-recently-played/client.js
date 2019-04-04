'use strict';

const Selectr = require('mobius1-selectr'),
  { get24Hours, nextSevenDays } = require('../../services/universal/dateTime'),
  { fetchDOM } = require('../../services/client/radioApi');

/*
 * Set the day of week select using the users locale language
 */
class StationRecentlyPlayed {
  constructor(el) {

    const select = el.querySelector('.day-of-week__select'),
      timeSelect = el.querySelector('.time__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      category = select.getAttribute('data-category');

    // eslint-disable-next-line one-var
    const selectr = new Selectr(select, {
        searchable: false,
        data: nextSevenDays(true)
      }),
      timeSelectr = new Selectr(timeSelect, {
        searchable: false,
        data: get24Hours()
      });

    selectr.on('selectr.change', (option) => this.loadContent({ stationId, gmtOffset, category }, option.value, timeSelectr.getValue()));
    timeSelectr.on('selectr.change', (option) => this.loadContent({ stationId, gmtOffset, category }, selectr.getValue(), option.value));
  }
  /**
   @typedef {object} StationDetails
   @property {number} stationId
   @property {number} gmtOffset
   @property {string} category
   */
  /**
   * load in new content from the api
   * Each time a select is update it calls loadContent with dayOfWeek or time and that
   * is stored on the object.
   * @param {StationDetails} stationDetails
   * @param {number} dayOfWeek
   * @param {number} hour
   * @returns {Promise}
   */
  async loadContent({stationId, gmtOffset, category }, dayOfWeek, hour) {
    const endpoint = `//${window.location.hostname}/_components/station-recently-played/instances/default.html`,
      doc = await fetchDOM(`${endpoint}?stationId=${stationId}&hour=${hour}&category=${category}&dayOfWeek=${dayOfWeek}&gmt_offset=${gmtOffset}`),
      content = doc.querySelector('.station-recently-played'),
      ul = document.querySelector('.station-recently-played');

    ul.parentNode.replaceChild(content, ul);
  }
}

module.exports = (el) => new StationRecentlyPlayed(el);
