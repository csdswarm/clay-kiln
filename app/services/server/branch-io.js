'use strict';

/**
 * @typedef {Object} MetaTag
 * @property {string} name
 * @property {string} content
 */

const
  _get = require('lodash/get'),
  { retrieveList } = require('./lists'),

  /**
   * Generate relevant Branch.io meta tags for the page.
   * @param {Object} locals
   * @param {Object} data
   * @returns {Promise<MetaTag[]>}
   */
  getBranchMetaTags = async (locals, data) => {
    const tags = [],
      addTag = (name, content) => {
        tags.push({
          name: `branch:deeplink:${name}`,
          content
        });
      },
      isStation = _get(locals, 'station.slug', 'www') !== 'www',
      // https://regex101.com/r/SyxFxE/1
      isStationDetailPage = new RegExp(/\/.+\/*listen\/?$/).test(locals.url),
      timestamp = _get(locals, 'query.t');

    // primary section front
    if (data.sectionFront) {
      const listEntry = await getSectionFrontEntry(locals, data.sectionFront, true),
        displayName = listEntry ? listEntry.name : data.sectionFront;

      addTag('unity_site_categories', displayName);
    }

    // sports league
    if (data.sectionFront === 'sports' && data.secondarySectionFront) {
      const listEntry = await getSectionFrontEntry(locals, data.secondarySectionFront, false),
        displayName = listEntry ? listEntry.name : data.secondarySectionFront;

      addTag('unity_site_league', displayName);
    }

    if (isStationDetailPage) {
      _get(locals, 'station.genre', []).forEach(genre => addTag('player_site_genre', genre.name));
      addTag('player_site_market', _get(locals, 'station.market.display_name'));
      addTag('player_site_category', _get(locals, 'station.category'));
      addTag('station_id', _get(locals, 'station.id'));
      addTag('station_name', _get(locals, 'station.name'));
      addTag('station_logo', _get(locals, 'station.square_logo_small'));
      addTag('page', 'station-detail');
    } else {
      // article, gallery, section front pages
      if (isStation) { // under a station
        addTag('market', _get(locals, 'station.market.display_name'));
        addTag('category', _get(locals, 'station.category'));
        _get(locals, 'station.genre', []).forEach(genre => addTag('genre', genre.name));
        addTag('station_id', _get(locals, 'station.id'));
        addTag('station_logo', _get(locals, 'station.square_logo_small'));
      }
      // both national & station pages
      addTag('station_name', _get(locals, 'station.name'));
    }

    // timestamp
    if (timestamp) {
      addTag('timecode', timestamp);
    }

    return tags;
  },
  /**
   * Retrieves a section front list entry
   * @param {Object} locals
   * @param {string} slug
   * @param {boolean} isPrimary
   * @returns {Promise<Object>}
   */
  getSectionFrontEntry = async (locals, slug, isPrimary) => {
    const listName = isPrimary ? 'primary-section-fronts' : 'secondary-section-fronts',
      data = await retrieveList(listName, { locals });

    return data.find(entry => entry.value === slug);
  };

module.exports.getBranchMetaTags = getBranchMetaTags;
