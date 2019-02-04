'use strict';

const stationScheduleAPI = 'http://api.radio.com/v1/schedules?';

/**
 * @param {string} ref
 * @param {object} data
 * @returns {Promise}
 */
module.exports.render = async function (ref, data) {
  data.stationId = 373;
  data.dayOfWeek = 1;
//&filter[station_id]=${data.stationId}
  const response = await fetch(`${stationScheduleAPI}page[size]=100&page[number]=1&filter[day_of_week]=${data.dayOfWeek}`),
    json = await response.json();

  return {
    schedule: json.data
      .sort((item1, item2) => parseInt(item1.attributes.start_time.replace(/[^\d]/g, '')) > parseInt(item2.attributes.start_time.replace(/[^\d]/g, '')))
      .map((schedule) => {
        const item = schedule.attributes;

        return {
          display_schedule: item.display_schedule,
          start_time: item.start_time,
          end_time: item.end_time,
          image: item.show.image,
          name: item.show.name,
          site_url: item.show.site_url
        };
      })
  };
};
