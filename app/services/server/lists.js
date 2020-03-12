'use strict';

const
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  _unset = require('lodash/unset'),
  db = require('./db'),
  logger = require('../universal/log'),
  { asInjectable } = require('../universal/utils'),
  { STATION_AWARE_LISTS } = require('../universal/constants'),

  HOUR_IN_SECONDS = 360,

  internals = () => {
    const _ = {
      CACHE_TTL: HOUR_IN_SECONDS,
      STATION_AWARE: STATION_AWARE_LISTS,
      cacheKeyPrefix: name => `list:${name}`,
      db,
      get: _get,
      getFromCache: name => _.redis.get(_.cacheKeyPrefix(name)).then(cached => cached && JSON.parse(cached)),
      getFromDb: (name, locals) => _.db.get(`${locals.site.host}/_lists/${name}`),
      getFromLocals: (name, locals) => _.get(locals, ['lists', name]),
      log: logger.setup({ file: __filename }),
      remFromCache: name => _.redis.del(_.cacheKeyPrefix(name)),
      remFromLocals: (name, locals) => _.unset(locals, ['lists', name]),
      saveToCache: (name, data) => _.redis.set(_.cacheKeyPrefix(name), JSON.stringify(data), 'EX', _.CACHE_TTL),
      saveToLocals: (name, locals, data) => Object.isExtensible(locals) && _.set(locals, ['lists', name], data),
      set: _set,
      unset: _unset
    };

    // lazy load redis to prevent callthrough in disconnected environments that don't use it
    Object.defineProperty(_, 'redis', {
      configurable: true, enumerable: true,
      get() {
        const redis = require('./redis');

        Object.defineProperty(_, 'redis', { configurable: true, enumerable: true, writable: true, value: redis });
        return redis;
      }
    });

    return _;
  };

module.exports = asInjectable(internals, _ => ({
  /**
   * Gets the display name for a section front slug. Returns the slug if not found.
   *
   * @param {string} slug - The section front's ID
   * @param {object[]} data - The section front list
   * @returns {Promise<string>}
   */
  getSectionFrontName(slug, data) {
    const entry = data.find(entry => entry.value === slug);

    return entry ? entry.name : slug;
  },

  /**
   * Retrieves a Clay list, checking locals and Redis for cached results first.
   *
   * @param {string} list - The list name
   * @param {object} [locals]
   * @returns {Promise<any[]>}
   */
  async retrieveList(list, locals) {
    const isStationAware = _.STATION_AWARE[list],
      stationSlug = isStationAware && locals.stationForPermissions.site_slug || '',
      name = stationSlug ? `${stationSlug}-${list}` : list,
      saved = _.getFromLocals(name, locals) || await _.getFromCache(name);

    if (saved) {
      return saved;
    }

    try {
      const data = await _.getFromDb(name, locals);

      _.saveToCache(name, data);
      _.saveToLocals(name, locals, data);

      return data;
    } catch (e) {
      if (!(e.message.includes('Key not found in database') && name.startsWith(stationSlug))) {
        _.log('error', 'Error retrieving list', e);
      }
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
  uncacheList(name, locals) {
    _.remFromLocals(name, locals);
    return _.remFromCache(name);
  }
}));
