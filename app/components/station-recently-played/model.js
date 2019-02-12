'use strict';

//  data.playHistory = await helpers.getPlayHistory(data.station.id);
'use strict';

const radioAPI = require('../../services/server/radioApi'),
  helpers = require('./helpers'),
  { sendError } = require('../../services/universal/cmpt-error'),
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
  // ensure we have a stationid from the url or being passed from the station-detail
  if (!locals.stationId  && !locals.station) {
    return sendError(`No station supplied`, 404);
  }

  const stationId = locals.stationId ? locals.stationId : locals.station.id,
    gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    // using the station offset determine the current day 1 - 7 based
    stationDayOfWeek = ((new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay() - 7) % 7 + 7) % 8,
    dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
    json = await radioAPI.get('/schedules',
      {
        'page[size]': 50,
        'page[number]':1,
        'filter[day_of_week]': dayOfWeek,
        'filter[station_id]': stationId
      }
    );

  return {
    recent: !json.data ? [] :
      json.data
      // sort by start date
        .sort((item1, item2) => getTime(item1.attributes.start_time) > getTime(item2.attributes.start_time))
        // extract only the content we need as a flat record
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
        })
  };
};



module.exports.render = async (ref, data, locals) => {
  data.station = locals.station || data.station;
  if (!data.station) {
    sendError(`No station supplied`, 404);
  }
  console.log('data', data)

  return data;
};
