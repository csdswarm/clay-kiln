'use strict';

const radioApi = require('../../services/server/radioApi'),
  { apiDayOfWeek, formatUTC } = require('../../services/universal/dateTime'),
  { playingClass } = require('../../services/universal/spaLocals'),
  { getNowPlaying } = require('../../services/universal/station'),
  moment = require('moment'),
  _get = require('lodash/get');

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  // ensure we have a stationid from the url or being passed from the station-detail
  if (!locals.stationId  && !locals.station) {
    return data;
  }

  const stationId = locals.stationId ? locals.stationId : locals.station.id,
    gmt_offset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    category = (locals.category ? locals.category : _get(locals, 'station.category', '')).toLowerCase(),
    HISTORY_LIMIT = 20,
    // using the station offset determine the current day 1 - 7 based
    stationTime = new Date(new Date().getTime() + gmt_offset * 60 * 1000),
    stationDayOfWeek = apiDayOfWeek(stationTime.getDay()),
    stationHour = stationTime.getHours(),
    currentDayOfWeek = new Date().getDay(),
    dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
    hour = locals.hour ? parseInt(locals.hour) : stationHour,
    offsetDayOfWeek = dayOfWeek - Math.floor((hour + parseInt(gmt_offset)) / 24),
    beforeDate = moment().day(dayOfWeek > currentDayOfWeek ? offsetDayOfWeek - 7 : offsetDayOfWeek).hour(hour).minute(59),
    formattedBeforeDate = beforeDate.format('YYYY-MM-DDTHH:mm:ss'),
    now_playing = getNowPlaying(locals, stationId),
    play_history = radioApi.get(`stations/${stationId}/play_history?event_count=${HISTORY_LIMIT}&before_date=${encodeURIComponent(formattedBeforeDate)}`, null, null, { ttl: radioApi.TTL.MIN * 3, expire: radioApi.TTL.DAY * 7 }, locals).catch(() => {}),
    [playing, history] = await Promise.all([now_playing, play_history]),
    validHistory = history && history.data && history.data.events && history.data.events.recent_events,
    currentHour = beforeDate.isAfter(stationTime),
    validPlaying = currentHour && playing && playing.data && playing.data.event && playing.data.event.current_event;

  if (validHistory || validPlaying) {
    if (validPlaying) {
      playing.data.event.current_event.playing = true;
      // ensure what is currently playing is the same title
      if (history.data.events.recent_events[0].title === playing.data.event.current_event.title) {
        history.data.events.recent_events[0] = playing.data.event.current_event;
      } else {
        history.data.events.recent_events.unshift(playing.data.event.current_event);
      }
    }

    data.station = { id: stationId, category, gmt_offset, playingClass: playingClass(locals, stationId) };
    data.schedule = history.data.events.recent_events
      .map((item) => {
        return {
          playing: item.playing,
          start_time: formatUTC(item.timePlayedUtc),
          artist: item.artist,
          image: item.imageUrl,
          title: item.title,
          site_url: ''
        };
      });
  }
  return data;
};
