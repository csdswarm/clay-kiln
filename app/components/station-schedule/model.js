'use strict';

const radioAPI = require('../../services/server/radioApi'),
  { playingClass } = require('../../services/server/spaLocals'),
  { getTime, currentlyBetween, apiDayOfWeek, formatUTC } = require('../../services/universal/dateTime'),
  _get = require('lodash/get');


/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  // ensure we have a stationid from the url or being passed from the station-detail
  if (!locals.stationId && !locals.station) {
    return data;
  }

  const stationId = parseInt(locals.stationId ? locals.stationId : locals.station.id),
    gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    category = (locals.category ? locals.category : _get(locals, 'station.category', '')).toLowerCase(),
    // using the station offset determine the current day 1 - 7 based
    stationDayOfWeek = apiDayOfWeek(new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay()),
    dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
    json = await radioAPI.get('schedules',
      {
        'page[size]': 50,
        'page[number]':1,
        'filter[day_of_week]': dayOfWeek,
        'filter[station_id]': stationId
      },
      null,
      {},
      locals
    );

  // if there is no data for the current day, check to see if there is any data for this station
  if (json.data && !json.data.length) {
    const anySchedule = await radioAPI.get('schedules',
      {
        'page[size]': 1,
        'page[number]':1,
        'filter[station_id]': stationId
      },
      null,
      {},
      locals);

    if (anySchedule.data && !anySchedule.data.length) {
      return data;
    }
  }
  return {
    station: {
      category,
      id: stationId,
      gmt_offset,
      playingClass: playingClass(locals, stationId)
    },
    schedule: !json.data ? [] :
      json.data
        // extract only the content we need as a flat record
        .map((schedule) => {
          const item = schedule.attributes;

          return {
            playing: dayOfWeek === stationDayOfWeek && currentlyBetween(item.start_time, item.end_time),
            start_time: formatUTC(getTime(item.start_time)),
            end_time: formatUTC(getTime(item.end_time)),
            image: item.show.image,
            name: item.show.name,
            site_url: item.show.site_url
          };
        })
  };
};
