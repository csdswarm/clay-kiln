'use strict';

const radioApi = require('../server/radioApi'),
  { getTime, currentlyBetween, apiDayOfWeek, formatUTC } = require('./dateTime'),
  log = require('./log').setup({ file: __filename }),
  _get = require('lodash/get'),
  _find = require('lodash/find'),
  _has = require('lodash/has'),

  /**
   * Retrieve and set now playing song from api
   *
   * @param {number} stationId
   * @param {Object} [data]
   * @param {Object} [locals]
   * @param {Object} [argObj]
   * @param {Object} [argObj.radioApiOpts]
   * @returns {object}
  */
  getNowPlaying = async (stationId, data = null, locals, argObj = {}) => {
    const { radioApiOpts = {} } = argObj,
      now_playing = await radioApi.get(
        `/stations/${ stationId }/now_playing`,
        null,
        null,
        Object.assign({ ttl: radioApi.TTL.MIN * 3 }, radioApiOpts),
        locals
      ).catch(err => {
        log('error', 'error when getting now_playing', err);
      });

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
   * @param {Object} config
   * @param {number} config.stationId
   * @param {number} config.pageSize
   * @param {number} config.pageNum
   * @param {boolean} config.filterByDay
   * @param {Object} locals
   * @param {Object} [argObj]
   * @param {Object} [argObj.data]
   * @param {boolean} [argObj.onAir]
   * @param {Object} [argObj.radioApiOpts]
   * @returns {Promise}
  */
  getSchedule = async (config, locals, argObj = {}) => {
    const {
        data = null,
        onAir = false,
        radioApiOpts = {}
      } = argObj,
      { stationId, pageSize, pageNum, filterByDay } = config,
      gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
      // using the station offset determine the current day 1 - 7 based
      stationDayOfWeek = apiDayOfWeek(new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay()),
      dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
      params = {
        'page[size]': pageSize,
        'page[number]': pageNum,
        'filter[station_id]': stationId
      };

    if (filterByDay) {
      params['filter[day_of_week]'] = dayOfWeek;
    }

    const schedules = await radioApi.get(
      'schedules',
      params,
      null,
      radioApiOpts,
      locals
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
