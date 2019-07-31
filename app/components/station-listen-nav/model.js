'use strict';

const radioApi = require('../../services/server/radioApi'),
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
    console.log('now playing', data.nowPlaying);
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

    console.log(dayOfWeek, locals.station.id, schedules);
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
        console.log("onair", data.onAir);
      }
    }
  };

module.exports.render = async (ref, data, locals) => {
  locals.station = {
    "id": 369,
    "name": "MIX 105.1",
    "website": "http://www.mix1051.com",
    "callsign": "WOMXFM",
    "slug": "mix-1051",
    "site_slug": "mix1051",
    "category": "Music",
    "listen_live_url": "http://player.radio.com/listen/station/mix-1051",
    "hero_image": "https://images.radio.com/logos/morningmixuse.jpg",
    "square_logo_small": "https://images.radio.com/logos/mixsquaregrey.png",
    "square_logo_large": "https://images.radio.com/logos/mixsquaregrey.png",
    "gmt_offset": -5,
    "primary_color": "#dd1086",
    "secondary_color": "#ffffff",
    "phonetic_name": "Mix One Oh Five Point One Orlando"
  }
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await getNowPlaying(data, locals);
  await getShowOnAir(data, locals);

  data.station = locals.station;

  return data;
};
