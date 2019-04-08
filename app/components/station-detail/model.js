'use strict';

/**
 * consolidate station data to form tags array
 *
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

/**
 * Adds station specific breadcrumbs links to the data
 *
 * @param {string} host the site hostname
 * @returns {function(data: Object): Object} The data object with the crumbs property appended
 */
function addBreadcrumbLinks(host) {

  /**
   * Takes a data object and adds a crumbs array of {url, text} objects to it that are specific to stations
   *
   * @param {Object} data The data object to extend
   * @returns {Object} the extended data object
   */
  return data => {
    data.crumbs = [
      {url: `//${host}/stations`, text: 'stations'},
      {url: `//${host}/${data.station.site_slug}/listen`, text: data.station.name}
    ];
    return data;
  };
}


module.exports.render = (uri, data, locals) => {
  if (!locals.params) {
    return data;
  }

  data.station = locals.station;
  data.tags = getStationTags(locals.station);
  data.category = locals.station.category.toLowerCase() || '';
  addBreadcrumbLinks(locals.site.host);

  return data;
};
