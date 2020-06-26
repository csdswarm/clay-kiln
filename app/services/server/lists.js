'use strict';

const
  _get = require('lodash/get'),
  _isEqual = require('lodash/isEqual'),
  _set = require('lodash/set'),
  _unset = require('lodash/unset'),
  db = require('./db'),
  logger = require('../universal/log'),
  { addAmphoraRenderTime, addLazyLoadProperty, postfix, prettyJSON } = require('../universal/utils'),
  { STATION_LISTS } = require('../universal/constants'),

  HOUR_IN_SECONDS = 3600,

  __ = {
    CACHE_TTL: HOUR_IN_SECONDS,
    STATION_LISTS,
    cacheKeyPrefix: name => `list:${name}`,
    db,
    equals: value => other => _isEqual(value, other),
    get: _get,
    getFromCache,
    getFromDb,
    getFromLocals: (name, locals) => __.get(locals, ['lists', name]),
    getStationPrefix: locals => __.postfix(__.get(locals, 'stationForPermissions.site_slug', ''), '-'),
    log: logger.setup({ file: __filename }),
    prependStation: (name, locals) => __.STATION_LISTS[name] ? `${__.getStationPrefix(locals)}${name}` : name,
    postfix,
    saveToCache: (name, data) => __.redis.set(__.cacheKeyPrefix(name), JSON.stringify(data), 'EX', __.CACHE_TTL),
    saveToDb: (name, data, host) => __.db.put(`${host}/_lists/${name}`, JSON.stringify(data)),
    saveToLocals: (name, locals, data) => Object.isExtensible(locals) && __.set(locals, ['lists', name], data),
    set: _set,
    unset: _unset
  };

addLazyLoadProperty(__, 'redis', () => require('./redis'));

/**
 * Saves a list and simultaneously updates the locals and cache
 * @param {string} name the name of the list
 * @param {object[]} data the values to save in the list
 * @param {object} options
 * @param {object} [options.locals] the locals object
 * @param {string} [options.host] the host if locals.site.host is unavailable
 * @returns {object[]} the original data provided
 */
async function saveList(name, data, options) {
  const { log, prependStation, saveToCache, saveToDb, saveToLocals } = __,
    locals = options.locals,
    host = _get(locals, 'site.host', options.host),
    list = prependStation(name, locals);

  saveToLocals(list, locals, data);

  try {
    await Promise.all([
      saveToDb(list, data, host),
      saveToCache(list, data)
    ]);
    return data;
  } catch (e) {
    log('error', `There was a problem trying to save the list ${name}`, e);
  }
}

/**
   * Adds a new list item to a list if it's not already there.
   * @param {string} name the name of the list
   * @param {object} item the item to add
   * @param {object} options
   * @param {object} [options.locals] the locals object
   * @param {string} [options.host] the host name for db sets/gets to use if locals.site.host is unavailable or wrong
   * @return {object} the item being added to the list or undefined if it's already in the list
   */
async function addListItem(name, item, options) {
  const { equals } = __,
    list = await retrieveList(name, options),
    alreadyInList = list.find(equals(item));

  if (alreadyInList) {
    return;
  }

  list.push(item);

  await saveList(name, list, options);

  return item;
}

/**
   * deletes one or more targets from a list
   * @param {string} name the name of the list
   * @param {object|function} target an object that matches an existing item in the list or a function that returns true
   *       for any matching item in the list. The fn will be run through a filter receiving each item as a parameter
   * @param {object} options
   * @param {object} [options.locals] the locals object
   * @param {string} [options.host] the host name if locals.site.host is unavailable
   * @returns {object[]} any items that were removed from the list
   */
async function deleteListItem(name, target, options) {
  const { equals } = __,
    list = await retrieveList(name, options),
    itemToRemove = typeof target === 'function' ? target : equals(target),
    itemsToRemove = list.filter(itemToRemove);

  if (itemsToRemove.length) {
    const itemsToKeep = item => !itemToRemove(item),
      listWithoutTargets = list.filter(itemsToKeep);

    await saveList(name, listWithoutTargets, options);

    return itemsToRemove;
  }

  return [];
}

/**
     * Gets the display name for a section front slug. Returns the slug if not found.
     *
     * @param {string} slug - The section front's ID
     * @param {object[]} data - The section front list
     * @returns {Promise<string>}
     */
function getSectionFrontName(slug, data) {
  const entry = data.find(entry => entry.value === slug);

  return entry ? entry.name : slug;
}

/**
   * Retrieves a Clay list, checking locals and Redis for cached results first.
   *
   * @param {string} name - The list name
   * @param {object} options
   * @param {object} [options.locals] the locals object
   * @param {string} [options.host] the host name if locals.site.host is unavailable
   * @param {boolean} [options.shouldAddAmphoraTimings]
   * @param {string} [options.amphoraTimingLabelPrefix]
   * @returns {Promise<any[]>}
   */
async function retrieveList(name, options) {
  const { getFromCache, getFromDb, getFromLocals, log, prependStation,  saveToCache,  saveToLocals } = __,
    { locals } = options,
    host = _get(locals, 'site.host', options.host),
    list = prependStation(name, locals),
    saved = getFromLocals(list, locals) || await getFromCache(list, options);

  if (saved) {
    return saved;
  }

  try {
    const data = await getFromDb(list, host, options);

    await saveToCache(list, data);
    saveToLocals(list, locals, data);

    return data;
  } catch (e) {
    if (!(e.message.includes('Key not found in database') && list !== name)) {
      log('error', 'Error retrieving list', e);
    }
  }

  return [];
}

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
   * @param {object} options
   * @param {object} [options.locals] the locals object
   * @param {string} [options.host] the host name if locals.site.host is unavailable
   * @param {boolean} [options.shouldAddAmphoraTimings]
   * @param {string} [options.amphoraTimingLabelPrefix]
   * @returns {Promise<object|undefined>}
   */
async function updateListItem(name, item, key, options) {
  const { equals, log } = __,
    keyValue = item[key],
    list = await retrieveList(name, options),
    itemsToUpdate = list.filter(item => item[key] === keyValue),
    sameAsOrig = equals(item),
    out = {};

  if (itemsToUpdate.length > 1) {
    log('error', `Too many items contain the same key. Can\'t update.\n${prettyJSON({ itemsToUpdate })}`);
    return;
  }

  if (itemsToUpdate.length === 1 && !sameAsOrig(itemsToUpdate[0])) {
    const oldItem = itemsToUpdate[0];

    await deleteListItem(name, oldItem, options);

    out.from = oldItem;
  }

  if (await addListItem(name, item, options)) {
    out.to = item;
  }

  return out;
}

function getPrefixAndShouldAdd(options) {
  const {
    amphoraTimingLabelPrefix,
    shouldAddAmphoraTimings = false
  } = options;

  return {
    prefix: amphoraTimingLabelPrefix,
    shouldAdd: shouldAddAmphoraTimings
  };
}

function getFromCache(name, options) {
  const cacheKey = __.cacheKeyPrefix(name),
    beforeRedis = new Date(),
    { locals } = options;

  try {
    return __.redis.get(cacheKey).then(cached => cached && JSON.parse(cached));
  } finally {
    addAmphoraRenderTime(
      locals,
      {
        data: { cacheKey },
        label: 'get from redis',
        ms: new Date() - beforeRedis
      },
      getPrefixAndShouldAdd(options)
    );
  }
}

function getFromDb(name, host, options) {
  const beforePostgres = new Date(),
    uri = `${host}/_lists/${name}`,
    { locals } = options;

  try {
    return __.db.get(uri);
  } finally {
    addAmphoraRenderTime(
      locals,
      {
        data: { uri },
        label: 'get from postgres',
        ms: new Date() - beforePostgres
      },
      getPrefixAndShouldAdd(options)
    );
  }
}

module.exports = {
  _internals: __,
  deleteListItem,
  getSectionFrontName,
  retrieveList,
  saveList,
  updateListItem
};
