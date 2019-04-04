'use strict';
const radioApiService = require('../../services/server/radioApi');

/**
 * consolidate station data to form tags array
 *
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  if (station.category) {
    tags.push({
      text: null,
      slug: null,
      type: station.category.toLowerCase()
    });
  }
  if (station.category !== station.genre_name.toString()) {
    station.genre_name.forEach(genre => {
      tags.push({
        text: genre.toLowerCase(),
        slug: genre.toLowerCase(), // todo: use slugify service
        type: 'music'
      });
    });
  }
  if (station.market.display_name) {
    tags.push({
      text: station.market.display_name.toLowerCase(),
      slug: station.market.display_name.toLowerCase(), // todo: use slugify service
      type: 'location'
    });
  }
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

  return radioApiService
    .get('stations', { filter: { site_slug: locals.params.dynamicStation } })
    .then(response => {
      if (response.data) {
        // station object is available to child components through locals.station
        data.station = locals.station = response.data[0].attributes || {};
        data.tags = getStationTags(response.data[0].attributes);
        data.category = response.data[0].attributes.category.toLowerCase() || '';
      }
      return data;
    })
    .then(addBreadcrumbLinks(locals.site.host));
};
