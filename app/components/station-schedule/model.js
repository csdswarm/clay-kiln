'use strict';

const radioAPI = require('../../services/server/radioApi'),
  /**
   * @param {string} [string]
   * @returns {number}
   */
  getTime = (string) => {
    const now = new Date();

    if (string) {
      const arr = string.split(':');

      now.setUTCHours(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]));
    }

    return now.getTime();
  },
  /**
   * @param {string} start
   * @param {string} end
   * @returns {boolean}
   */
  currentlyPlaying = (start, end) => {
    const now = getTime();

    return getTime(start) <= now && getTime(end) > now;
  };

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  const stationId = locals.stationId ? locals.stationId : locals.station.id,
    gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    stationDayOfWeek = ((new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay() - 7) % 7 + 7) % 8,
    dayOfWeek = locals.dayOfWeek ? locals.dayOfWeek : stationDayOfWeek,
    json = await radioAPI.get('/schedules', { 'page[size]': 100, 'page[number]':1, 'filter[day_of_week]': dayOfWeek ? dayOfWeek : 1, 'filter[station_id]': stationId ? stationId : 0 });

  return {
    schedule: json.data ? json.data
    // sort by start date
      .sort((item1, item2) => getTime(item1.attributes.start_time) > getTime(item2.attributes.start_time))
      // extract only the first we need as a flat record
      .map((schedule) => {
        const item = schedule.attributes;

        return {
          playing: dayOfWeek === stationDayOfWeek && currentlyPlaying(item.start_time, item.end_time),
          start_time: new Date(getTime(item.start_time)),
          end_time: new Date(getTime(item.end_time)),
          image: item.show.image,
          name: item.show.name,
          site_url: item.show.site_url
        };
      }) : []
  };
};

