'use strict';

const radioApi = require('../server/radioApi'),
  { getTime, currentlyBetween, apiDayOfWeek, formatUTC } = require('../universal/dateTime'),
  _get = require('lodash/get'),
  _find = require('lodash/find'),
  _has = require('lodash/has'),

  /**
   * Retrieve and set now playing song from api
   *
   * @param {number} stationId
   * @param {Object} [data]
  */
  getNowPlaying = async (stationId, data = null) => {
    const now_playing = await radioApi.get(`/stations/${ stationId }/now_playing`, null, null, { ttl: radioApi.TTL.MIN * 3 }).catch(() => {});

    if (data && _has(now_playing, 'data.event.current_event')) {
      const song = now_playing.data.event.current_event;

      data.nowPlaying = {
        ...song,
        artist: song.artist.replace(/-/g, ', ')
      };
    }
    return now_playing;
  },
  /**
   * Retrieve station show schedules from api and
   * set current show on air if enabled
   *
   * @param {number} stationId
   * @param {Object} locals
   * @param {Object} [data]
   * @param {boolean} [onAir]
  */
  getSchedule = async (stationId, locals, data = null, onAir = false) => {
    const gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
      // using the station offset determine the current day 1 - 7 based
      stationDayOfWeek = apiDayOfWeek(new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay()),
      dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
      schedules = await radioApi.get('schedules',
        {
          'page[size]': 50,
          'page[number]':1,
          'filter[day_of_week]': dayOfWeek,
          'filter[station_id]': stationId
        }
      );

    if (onAir && _has(schedules, 'data.length')) {
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
    } else if (!onAir) {
      return schedules;
    }
  };


module.exports.getNowPlaying = getNowPlaying;
module.exports.getSchedule = getSchedule;
