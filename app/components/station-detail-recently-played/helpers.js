'use strict';

const rest = require('../../services/universal/rest'),
  querystring = require('querystring'),
  moment = require('moment'),
  API_BASE_URL = 'https://api.radio.com/v1';

/**
 *
 * @param {stationId} station ID which is returned from the /stations endpoint in the radio API
 * @param {beforeDate} (optional) a date string which will be formatted to the required format for beforeDate
 * @return {Array} a list of songs that have played before beforeDate for stationId
 */
async function getPlayHistory(stationId, beforeDate = null) {
  if (!stationId) {
    return [];
  }

  if (!beforeDate) {
    beforeDate = moment().format('YYYY-MM-DDTHH:mm:ss');
  } else {
    beforeDate = moment(beforeDate).format('YYYY-MM-DDTHH:mm:ss');
  }

  const queryParams = querystring.stringify({ event_count: 25,  before_date: beforeDate}),
    url = `${API_BASE_URL}/stations/${stationId}/play_history?${queryParams}`;

  try {
    const { data } = await rest.get(url);
    return (data.events && data.events.recent_events)
      ? data.events.recent_events
      : [];
  } catch(e) {
    return [];
  }
}

module.exports.getPlayHistory = getPlayHistory;
