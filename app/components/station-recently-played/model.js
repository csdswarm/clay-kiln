'use strict';

const radioAPI = require('../../services/server/radioApi'),
  moment = require('moment');

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
    gmtOffset = locals.gmt_offset ? locals.gmt_offset : locals.station.gmt_offset,
    dayOfWeek = locals.dayOfWeek ? locals.dayOfWeek : null,
    hour = locals.hour ? locals.hour : null,
    beforeDate = dayOfWeek && hour ? moment().day(dayOfWeek).hour(hour - gmtOffset).format('YYYY-MM-DDTHH:mm:ss') : moment().format('YYYY-MM-DDTHH:mm:ss'),
    json = await radioAPI.get(`/stations/${stationId}/play_history`,
      {
        event_count: 50,
        before_date: beforeDate
      }
    );

  if (json.data && json.data.events && json.data.events.recent_events) {
    let first = true;

    data.schedule = json.data.events.recent_events
      .sort((item1, item2) => moment(item2.timePlayed) - moment(item1.timePlayed))
      .map((item) => {
        const payload = {
          playing: first == true && moment().hour() == moment(item.timePlayedUtc).hour(),
          start_time: item.timePlayedUtc,
          artist: item.artist,
          image: item.imageUrl,
          title: item.title,
          site_url: ''
        };

        first = false;
        return payload;
      });
  }
  return data;
};

