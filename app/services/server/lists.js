'use strict';

const
  _get = require('lodash/get'),
  _isEqual = require('lodash/isEqual'),
  _set = require('lodash/set'),
  _unset = require('lodash/unset'),
  db = require('./db'),
  logger = require('../universal/log'),
  { addLazyLoadProperty, asInjectable, postfix, prettyJSON } = require('../universal/utils'),
  { STATION_AWARE_LISTS } = require('../universal/constants'),

  HOUR_IN_SECONDS = 360,

  internals = () => {
    const _ = {
      CACHE_TTL: HOUR_IN_SECONDS,
      STATION_AWARE: STATION_AWARE_LISTS,
      cacheKeyPrefix: name => `list:${name}`,
      db,
      equals: value => other => _isEqual(value, other),
      get: _get,
      getFromCache: name => _.redis.get(_.cacheKeyPrefix(name)).then(cached => cached && JSON.parse(cached)),
      getFromDb: (name, locals) => _.db.get(`${_.resolveHost(locals)}/_lists/${name}`),
      getFromLocals: (name, locals) => _.get(locals, ['lists', name]),
      getStationPrefix: locals => _.postfix(_.get(locals, 'stationForPermissions.site_slug', ''), '-'),
      log: logger.setup({ file: __filename }),
      prependStation: (name, locals) => _.STATION_AWARE[name] ? `${_.getStationPrefix(locals)}${name}` : name,
      postfix,
      remFromCache: name => _.redis.del(_.cacheKeyPrefix(name)),
      remFromLocals: (name, locals) => _.unset(locals, ['lists', name]),
      resolveHost: value => typeof value === 'string' ? value : value.site.host,
      saveToCache: (name, data) => _.redis.set(_.cacheKeyPrefix(name), JSON.stringify(data), 'EX', _.CACHE_TTL),
      saveToDb: (name, data, locals) => _.db.put(`${_.resolveHost(locals)}/_lists/${name}`, JSON.stringify(data)),
      saveToLocals: (name, locals, data) => Object.isExtensible(locals) && _.set(locals, ['lists', name], data),
      set: _set,
      unset: _unset
    };

    addLazyLoadProperty(_, 'redis', () => require('./redis'));

    return _;
  };

module.exports = asInjectable(internals, _ => {
  const lists = {
    /**
     * Adds a new list item to a list if it's not already there.
     * @param {string} name the name of the list
     * @param {object} item the item to add
     * @param {object|string} locals (if this is a string, it is assumed to be the host)
     * @return {object} the item being added to the list or undefined if it's already in the list
     */
    async addListItem(name, item, locals) {
      const { retrieveList, saveList } = lists,
        list = await retrieveList(name, locals),
        alreadyInList = list.find(_.equals(item));

      if (alreadyInList) {
        return;
      }

      list.push(item);

      await saveList(name, list, locals);

      return item;
    },

    /**
     * deletes one or more targets from a list
     * @param {string} name the name of the list
     * @param {object|function} target an object that matches an existing item in the list or a function that returns true
     *       for any matching item in the list. The fn will be run through a filter receiving each item as a parameter
     * @param {object|string} locals if this is a string, it is assumed to be the host
     * @returns {object[]} any items that were removed from the list
     */
    async deleteListItem(name, target, locals) {
      const { retrieveList, saveList } = lists,
        list = await retrieveList(name, locals),
        itemToRemove = typeof target === 'function' ? target : _.equals(target),
        itemsToRemove = list.filter(itemToRemove);

      if (itemsToRemove.length) {
        const itemsToKeep = item => !itemToRemove(item),
          listWithoutTargets = list.filter(itemsToKeep);

        await saveList(name, listWithoutTargets, locals);

        return itemsToRemove;
      }

      return [];
    },

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
     * @param {string} name - The list name
     * @param {object|string} locals if this is a string, it is assumed to be the host
     * @returns {Promise<any[]>}
     */
    async retrieveList(name, locals) {
      const list = _.prependStation(name, locals),
        saved = _.getFromLocals(list, locals) || await _.getFromCache(list);

      if (saved) {
        return saved;
      }

      try {
        const data = await _.getFromDb(list, locals);

        _.saveToCache(list, data);
        _.saveToLocals(list, locals, data);

        return data;
      } catch (e) {
        if (!(e.message.includes('Key not found in database') && list !== name)) {
          _.log('error', 'Error retrieving list', e);
        }
      }

      return [];
    },

    /**
     * Saves a list and simultaneously updates the locals and cache
     * @param {string} name the name of the list
     * @param {object[]} data the values to save in the list
     * @param {object|string} locals if this is a string, it is assumed to be the host
     * @returns {object[]} the original data provided
     */
    async saveList(name, data, locals) {
      const list = _.prependStation(name, locals);

      await Promise.all([
        _.saveToDb(list, data, locals),
        _.saveToCache(list, data),
        _.saveToLocals(list, locals, data)
      ]);

      return data;
    },

    /**
     * Remove a list from Redis cache and locals
     *
     * @param {string} name
     * @param {object|string} locals if this is a string it is assumed to be the host
     * @returns {Promise<void>}
     */
    uncacheList(name, locals) {
      _.remFromLocals(name, locals);
      return _.remFromCache(name);
    },

    /**
     * Updates an item in the list. If the item does not exist, it adds it to the list.
     *
     * - If the item is changed, the result will be an object with `from` and `to` properties indicating how the
     * value changed.
     * - If the item did not previously exist there will only be a `to` property
     * - If there are more than one item already in the list with the same key value and error will be logged and there
     * no value will be returned.
     * - If the value does not change, then neither the `from` or `to` values will exist on the output.
     * @param {string} name the name of the list
     * @param {object} item the item to update in the list
     * @param {string} key the property on the item to match to the property in the list
     * @param {object|string} locals if this is a string, it is assumed to be the host
     * @returns {Promise<object|undefined>}
     */
    async updateListItem(name, item, key, locals) {
      const { addListItem, deleteListItem, retrieveList } = lists,
        keyValue = item[key],
        list = await retrieveList(name, locals),
        itemsToUpdate = list.filter(item => item[key] === keyValue),
        sameAsOrig = _.equals(item),
        out = {};

      if (itemsToUpdate.length > 1) {
        _.log('error', `Too many items contain the same key. Can\'t update.\n${prettyJSON({ itemsToUpdate })}`);
        return;
      }
      
      if (itemsToUpdate.length === 1 && !sameAsOrig(itemsToUpdate[0])) {
        const oldItem = itemsToUpdate[0];

        await deleteListItem(name, oldItem, locals);
        
        out.from = oldItem;
      }

      if (await addListItem(name, item, locals)) {
        out.to = item;
      }
       
      return out;
    }
  };

  return lists;
});
