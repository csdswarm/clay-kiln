'use strict';

const Selectr = require('mobius1-selectr'),
  { todaysTimes, nextSevenDays, usersTimeZone } = require('../../services/client/dateTime');

/*
 * Set the day of week select using the users locale language
 */
class StationRecentlyPlayed {
  constructor(el) {
    this.timeZone = usersTimeZone();

    const select = el.querySelector('.day-of-week__select'),
      timeSelect = el.querySelector('.time__select'),
      stationId = parseInt(select.getAttribute('data-station-id')),
      gmtOffset = parseInt(select.getAttribute('data-gmt-offset')),
      ul = el.querySelector('.station-recently-played'),
      selectr = new Selectr(select, {
        searchable: false
      }),
      timeSelectr = new Selectr(timeSelect, {
        searchable: false
      });

    nextSevenDays().forEach((day) => select.add(new Option(day.text, day.value)));
    todaysTimes().forEach((time) => timeSelect.add(new Option(time.text, time.value)));

    this.dayOfWeek = new Date().getDay();
    selectr.setValue(this.dayOfWeek);

    this.hour = new Date().getHours();
    timeSelectr.setValue(this.hour);

    selectr.on('selectr.change', (option) => this.loadContent(stationId, gmtOffset, option.value, null));
    timeSelectr.on('selectr.change', (option) => this.loadContent(stationId, gmtOffset, null, option.value));

  }
  /**
   * load in new content from the api
   * dayOfWeek and time are nullable because they come from two selects.
   * Each time a select is update it calls loadContent with dayOfWeek or time and that
   * is stored on the object.
   * @param {number} stationId
   * @param {number} gmtOffset
   * @param {number} dayOfWeek
   * @param {number} hour
   * @returns {Promise}
   */
  async loadContent(stationId, gmtOffset, dayOfWeek, hour) {
    if (dayOfWeek) {
      this.dayOfWeek = dayOfWeek;
    } else {
      dayOfWeek = this.dayOfWeek;
    }
    if (hour) {
      this.hour = hour;
    } else {
      hour = this.hour;
    }
    // Initialize the DOM parser and set the HTML from the API call of the station-recently-played
    const parser = new DOMParser(),
      endpoint = `//${window.location.hostname}/_components/station-recently-played/instances/default.html`,
      response = await fetch(`${endpoint}?stationId=${stationId}&hour=${hour}&dayOfWeek=${dayOfWeek}&gmt_offset=${gmtOffset}&ignore_resolve_media=true`),
      html = await response.text(),
      doc = parser.parseFromString(html, 'text/html'),
      content = doc.querySelector('.station-recently-played'),
      ul = document.querySelector('.station-recently-played');

    ul.parentNode.replaceChild(content, ul);
  }
}

module.exports = (el) => new StationRecentlyPlayed(el);
