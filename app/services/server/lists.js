'use strict';

const _get = require('lodash/get'),
  _set = require('lodash/set'),
  db = require('./db'),
  redis = require('./redis'),
  log = require('../universal/log').setup({ file: __filename }),
  { addAmphoraRenderTime } = require('../universal/utils'),
  cacheKeyPrefix = 'list:',
  /**
   * Retrieves a Clay list, checking locals and Redis for cached results first.
   *
   * @param {string} name - The list name
   * @param {object} [locals]
   * @param {object} [argObj]
   * @param {boolean} [argObj.shouldAddAmphoraTimings]
   * @param {string} [argObj.amphoraTimingLabelPrefix]
   * @returns {Promise<any[]>}
   */
  retrieveList = async (name, locals, argObj = {}) => {
    const {
        shouldAddAmphoraTimings = false,
        amphoraTimingLabelPrefix
      } = argObj,
      localsList = _get(locals, ['lists', name]);

    // return from locals if it exists
    if (localsList) {
      return localsList;
    }

    const cacheKey = cacheKeyPrefix + name,
      beforeRedis = new Date();

    let cached;

    try {
      cached = await redis.get(cacheKey);
    } finally {
      addAmphoraRenderTime(
        locals,
        {
          data: { cacheKey },
          label: 'get from redis',
          ms: new Date() - beforeRedis
        },
        {
          prefix: amphoraTimingLabelPrefix,
          shouldAdd: shouldAddAmphoraTimings
        }
      );
    }

    // return from redis if it exists
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const beforePostgres = new Date(),
        uri = `${locals.site.host}/_lists/${name}`;

      let data;

      try {
        data = await db.get(uri);
      } finally {
        addAmphoraRenderTime(
          locals,
          {
            data: { uri },
            label: 'get from postgres',
            ms: new Date() - beforePostgres
          },
          {
            prefix: amphoraTimingLabelPrefix,
            shouldAdd: shouldAddAmphoraTimings
          }
        );
      }

      redis.set(cacheKey, JSON.stringify(data), 'EX', 3600); // 1 hour

      if (Object.isExtensible(locals)) {
        _set(locals, ['lists', name], data);
      }

      return data;
    } catch (e) {
      log('Error retrieving list', e);
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
