'use strict';

const { updateStationSyndicationType } = require('../../universal/create-content');

/**
 * Updates the stationSyndication type from being an array of strings to an array of objects.
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 */
module.exports = (uri, data) => {
  updateStationSyndicationType(data);

  return data;
};
