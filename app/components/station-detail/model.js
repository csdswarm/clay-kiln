'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * consolidate station data to form tags array
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  tags.push(station.category);
  tags = tags.concat(station.genre_name, station.market_name);
  tags = Array.from(new Set(tags));

  return tags;
}

module.exports.render = (uri, data, locals) => {
  if (!locals.params) {
    return data;
  }

  const route = `stations/${locals.params.dynamicStation}`;

  return radioApiService.get(route).then(response => {
    if (response.data) {
      data.station = response.data.attributes || {};
      data.tags = getStationTags(response.data.attributes);
      data.category = response.data.attributes.category.toLowerCase() || '';

      return data;
    } else {
      return data;
    }
  });
};
