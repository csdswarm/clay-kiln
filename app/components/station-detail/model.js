'use strict';
const slugifyService = require('../../services/universal/slugify'),
  { playingClass } = require('../../services/server/spaLocals'),
  NEWS_TALK = 'News & Talk',
  SPORTS = 'Sports',
  LOCATION = 'location';

/**
 * consolidate station data to form tags array
 *
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  if (station.genre_name) {
    station.genre_name.forEach(genre => {
      if (genre === NEWS_TALK || genre === SPORTS) {
        tags.push({
          text: null,
          slug: null,
          type: slugifyService(genre)
        });
      } else {
        tags.push({
          text: genre.toLowerCase(),
          slug: slugifyService(genre),
          type: slugifyService(station.category)
        });
      }
    });
  }
  if (station.market.display_name) {
    tags.push({
      text: station.market.display_name.toLowerCase(),
      slug: slugifyService(station.market.display_name),
      type: LOCATION
    });
  }
  return tags;
}

/**
 * Add meta-title and meta-description to station object
 *
 * @param {object} station
 * @returns {object}
 */
function addMetaData(station) {
  if (!station) {
    return {};
  }
  return {
    ...station,
    metaTitle: `Listen to ${station.name} Online`,
    metaDescription: `Listen to ${station.name} - ${station.slogan}. Live. Anytime. Anywhere`
  };
}

/**
 * Adds station specific breadcrumbs links to the data
 *
 * @param {Object} data The data object to extend
 * @param {string} host the site hostname
 * @returns {Object} the extended data object
 */
function addBreadcrumbLinks(data, host) {
  data.crumbs = [
    {url: `//${host}/stations`, text: 'stations'},
    {url: `//${host}/${data.station.site_slug}/listen`, text: data.station.name}
  ];
  return data;
}


module.exports.render = (uri, data, locals) => {
  if (!locals.params) {
    return data;
  }

  locals.station.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station = addMetaData(locals.station);
  data.tags = getStationTags(locals.station);
  data.category = locals.station.category.toLowerCase() || '';
  addBreadcrumbLinks(data, locals.site.host);

  return data;
};
