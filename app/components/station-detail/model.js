'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * consolidate station data to form tags array
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  tags.push({
    text: station.category,
    type: station.category
  });
  if (station.category !== station.genre_name.toString()) {
    tags = tags.concat({
      text: station.genre_name.toString(),
      type: station.category
    });
  }
  tags = tags.concat({
    text: station.market_name,
    type: 'location'
  });

  return tags;
}

module.exports.render = (uri, data, locals) => {
  if (!locals.params) {
    return data;
  }

  return radioApiService.get('stations', { filter: { site_slug: locals.params.dynamicStation } }).then(response => {
    if (response.data) {
      // station object is available to child components through locals.station
      data.station = locals.station = response.data[0].attributes || {};
      data.tags = getStationTags(response.data[0].attributes);
      data.category = response.data[0].attributes.category.toLowerCase() || '';

      return data;
    } else {
      return data;
    }
  });
};
