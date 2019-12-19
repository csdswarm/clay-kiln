'use strict';

/**
 * @typedef {Object} MetaTag
 * @property {string} name
 * @property {string} content
 */

const db = require('./db'),
  _get = require('lodash/get'),
  redis = require('./redis'),
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

    // station page
    if (isStation) {
      _get(locals, 'station.genre', []).forEach(genre => addTag('player_site_genre', genre.name));
      addTag('player_site_market', _get(locals, 'station.market.display_name'));
      addTag('player_site_category', _get(locals, 'station.category'));
      addTag('station_id', _get(locals, 'station.id'));
      addTag('station_name', _get(locals, 'station.name'));
      addTag('station_logo', _get(locals, 'station.square_logo_small'));
      addTag('page', 'station-detail');
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
      data = await retrieveList(locals, listName);

    return data.find(entry => entry.value === slug);
  },
  /**
   * Retrieves a list from cache or db
   * @param {Object} locals
   * @param {string} name
   * @returns {Promise<Array<Object>>}
   */
  retrieveList = async (locals, name) => {
    const key = `list:${name}`,
      cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await db.get(`${locals.site.host}/_lists/${name}`);

    redis.set(key, JSON.stringify(data), 'EX', 3600); // 1 hour

    return data;
  };

module.exports.getBranchMetaTags = getBranchMetaTags;
