'use strict';
const radioApiService = require('../../services/server/radioApi'),
  _uniq = require('lodash/uniq');

/**
 * consolidate station data to form tags array
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  tags.push(station.category);
  tags = tags.concat(station.genre_name).concat(station.market_name);
  tags = _uniq(tags);

  return tags;
}

module.exports.render = (uri, data, locals) => {
  if (!locals.params) {
    return data;
  }

  const route = `stations/${locals.params.dynamicStation}`;

  return radioApiService.get(route).then(response => {
    if (response.data) {
      data.station = response.data.attributes;
      data.tags = getStationTags(response.data.attributes);

      return data;
    } else {
      return data;
    }
  });
};
