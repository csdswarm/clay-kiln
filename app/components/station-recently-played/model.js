'use strict';

const rest = require('../../services/universal/rest'),
  { apiDayOfWeek } = require('../../services/universal/dateTime'),
  clientPlayer = require('../../services/client/ClientPlayerInterface')(),
  moment = require('moment'),
  radioAPI = 'https://api.radio.com/v1';

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
    category = (locals.category ? locals.category : locals.station.category).toLowerCase(),
    playingClass = clientPlayer.playingClass(locals, stationId),
    // using the station offset determine the current day 1 - 7 based
    stationDayOfWeek = apiDayOfWeek(new Date(new Date().getTime() + gmt_offset * 60 * 1000).getDay()),
    stationHour = new Date(new Date().getTime() + gmt_offset * 60 * 1000).getHours(),
    dayOfWeek = locals.dayOfWeek ? parseInt(locals.dayOfWeek) : stationDayOfWeek,
    hour = locals.hour ? parseInt(locals.hour) : stationHour,
    beforeDate = moment().day(dayOfWeek).hour(hour).format('YYYY-MM-DDTHH:mm:ss'),
    now_playing = rest.get(`${radioAPI}/stations/${stationId}/now_playing`).catch(() => {}),
    play_history = rest.get(`${radioAPI}/stations/${stationId}/play_history?event_count=50&before_date=${encodeURIComponent(beforeDate)}`).catch(() => {}),
    shows = await Promise.all([now_playing, play_history]),
    playing = shows[0],
    history = shows[1],
    validHistory = history && history.data && history.data.events && history.data.events.recent_events,
    currentHour = dayOfWeek === stationDayOfWeek && hour === stationHour,
    validPlaying = currentHour && playing && playing.data && shows[0].data.event && shows[0].data.event.current_event;

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

    data.station = { id: stationId, category, playingClass };
    data.schedule = history.data.events.recent_events
      .map((item) => {
        return {
          playing: item.playing,
          start_time: item.timePlayedUtc,
          artist: item.artist,
          image: item.imageUrl,
          title: item.title,
          site_url: ''
        };
      });
  }
  return data;
};

