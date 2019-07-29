'use strict';

const radioApi = require('../../services/server/radioApi'),
  { apiDayOfWeek } = require('../../services/universal/dateTime'),
  { playingClass } = require('../../services/universal/spaLocals'),
  { currentlyBetween, apiDayOfWeek, formatUTC } = require('../../services/universal/dateTime'),
  _get = require('lodash/get'),
  _find = require('lodash/find'),
/**
 * Retrieve and set now playing song from api
 *
 * @param {Object} data
*/
getNowPlaying = async (data) => {
  const now_playing = await radioApi.get(`/stations/${ locals.station.id }/now_playing`, null, null, { ttl: radioApi.TTL.MIN * 3 }).catch(() => {});

  data.nowPlaying = _get(now_playing, 'data.event.current_event');
},
/**
 * Retrieve and set current show on air from api
 *
 * @param {Object} data
*/
getShowOnAir = async (data) => {
  const gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    // using the station offset determine the current day 1 - 7 based
    stationDayOfWeek = apiDayOfWeek(new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay()),
    dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
    schedules = await radioApi.get('schedules',
      {
        'page[size]': 50,
        'page[number]':1,
        'filter[day_of_week]': dayOfWeek,
        'filter[station_id]': locals.station.id
      }
    ),
    { attributes: onAir } = !schedules.data ? {} : _find(schedules.data, schedule => {
      const item = schedule.attributes;

      return dayOfWeek === stationDayOfWeek && currentlyBetween(item.start_time, item.end_time);
    });

  data.onAir = {
    image: onAir.show.image,
    name: onAir.show.name,
    timeSlot: `${ onAir.display_schedule.split(':')[0] }: ${ formatUTC(getTime(onAir.start_time)) }`
  };
};

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await getNowPlaying();
  await getShowOnAir();

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
