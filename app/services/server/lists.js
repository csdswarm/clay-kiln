'use strict';

const _get = require('lodash/get'),
  _set = require('lodash/set'),
  db = require('./db'),
  redis = require('./redis'),
  log = require('../universal/log').setup({ file: __filename }),
  cacheKeyPrefix = 'list:',
  /**
   * Retrieves a Clay list, checking locals and Redis for cached results first.
   *
   * @param {string} name - The list name
   * @param {object} [locals]
   * @returns {Promise<any[]>}
   */
  retrieveList = async (name, locals) => {
    const localsList = _get(locals, ['lists', name]);

    // return from locals if it exists
    if (localsList) {
      return localsList;
    }

    const cacheKey = cacheKeyPrefix + name,
      cached = await redis.get(cacheKey);

    // return from redis if it exists
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const data = await db.get(`${locals.site.host}/_lists/${name}`);

      redis.set(cacheKey, JSON.stringify(data), 'EX', 3600); // 1 hour

      if (Object.isExtensible(locals)) {
        _set(locals, ['lists', name], data);
      }

      return data;
    } catch (e) {
      log('error', 'Error retrieving list', e);
    }

    return [];
  },
  /**
   * Remove a list from Redis cache and locals
   *
   * @param {string} name
   * @param {object} [locals]
   * @returns {Promise<void>}
   */
  uncacheList = (name, locals) => {
    if (locals && locals.lists) {
      delete locals.lists[name];
    }

    return redis.del(cacheKeyPrefix + name);
  },
  /**
   * Gets the display name for a section front slug. Returns the slug if not found.
   *
   * @param {string} slug - The section front's ID
   * @param {object[]} data - The section front list
   * @returns {Promise<string>}
   */
  getSectionFrontName = (slug, data) => {
    const entry = data.find(entry => entry.value === slug);

    return entry ? entry.name : slug;
  };

module.exports.retrieveList = retrieveList;
module.exports.uncacheList = uncacheList;
module.exports.getSectionFrontName = getSectionFrontName;
