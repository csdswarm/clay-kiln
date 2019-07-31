'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  radioApi = require('../../services/server/radioApi'),
  { getTime, currentlyBetween, apiDayOfWeek, formatUTC } = require('../../services/universal/dateTime'),
  _get = require('lodash/get'),
  _find = require('lodash/find'),
  _has = require('lodash/has'),
  /**
   * Retrieve and set now playing song from api
   *
   * @param {Object} data
   * @param {Object} locals
  */
  getNowPlaying = async (data, locals) => {
    const now_playing = await radioApi.get(`/stations/${ locals.station.id }/now_playing`, null, null, { ttl: radioApi.TTL.MIN * 3 }).catch(() => {});

    if (_has(now_playing, 'data.event.current_event')) {
      const song = now_playing.data.event.current_event;

      data.nowPlaying = {
        ...song,
        artist: song.artist.replace(/-/g, ', ')
      };
    }
  },
  /**
   * Retrieve and set current show on air from api
   *
   * @param {Object} data
   * @param {Object} locals
  */
  getShowOnAir = async (data, locals) => {
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
      );

    if (_has(schedules, 'data.length')) {
      const show = _find(schedules.data, schedule => {
        const item = schedule.attributes;

        return dayOfWeek === stationDayOfWeek && currentlyBetween(item.start_time, item.end_time);
      });
      
      if (show) {
        const { attributes: onAir } = show;

        data.onAir = {
          image: _get(onAir, 'show.image'),
          name: _get(onAir, 'show.name'),
          scheduleDays: onAir.display_schedule ? onAir.display_schedule.split(':')[0] : '',
          startTime: onAir.start_time ? formatUTC(getTime(onAir.start_time)) : ''
        };
      }
    }
  };

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await getNowPlaying(data, locals);
  await getShowOnAir(data, locals);

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
