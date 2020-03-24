'use strict';

/**
 * Updates the stationSyndication type from being an array of strings to an array of objects.
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 */
module.exports = (uri, data) => {
  data.stationSyndication = (data.stationSyndication || [])
    .map(callsign => typeof callsign === 'string' ? { callsign } : callsign);

  return data;
};
