'use strict';

/**
 * README
 * - This file contains utilities to interact with locals.loadedIds as they
 *   relate to redis.
 *
 * Notes
 * - All of these functions should have empty equivalents in
 *   client/loaded-ids.js.  This is due to needing server-side functionality
 *   that doesn't make sense on the client side (when editing, deduping doesn't
 *   serve a purpose and would take a decent amount of work to implement).
 *
 * - I decided against making a new service where rdcSessionID is held in scope
 *   because of the simplicity of this service.  Should it get larger, I would
 *   rename this to 'make-loaded-ids-service' with a function that takes a
 *   rdcSessionID and returns the api to remove the redundancy of passing in
 *   rdcSessionID all the time.
 *
 * - All these return the raw redis results in case they're needed.  I don't
 *   suspect they will be useful though.
 */

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  _difference = require('lodash/difference'),
  redis = require('./redis'),
  api = {},
  getSessionKey = rdcSessionID => rdcSessionID + ':loaded-ids',
  oneHourInSeconds = 1000 * 60 * 60;

/**
 * If locals.loadedIds doesn't exist, then populate it from redis.
 * ** This mutates locals
 *
 * @param {object} locals
 */
async function initLoadedIdsIfNecessary(locals) {
  if (
    !_get(locals, 'loadedIds')
    && !_get(locals, 'rdcSessionID')
  ) {
    throw new Error(
      "locals must have either a truthy property 'loadedIds' or 'rdcSessionID'"
    );
  }

  if (!locals.loadedIds) {
    locals.loadedIds = await api.get(locals.rdcSessionID);
  }
}

/**
 * Deletes the redis key associated with the loaded ids
 *
 * @param {string} rdcSessionID
 * @returns {Promise} - the result of redis.del
 */
api.clear = (rdcSessionID) => {
  const key = getSessionKey(rdcSessionID);

  return redis.del(key);
};

/**
 * Gets the loaded ids from redis
 *
 * @param {string} rdcSessionID
 * @returns {Promise} - the result of redis.lrange
 */
api.get = (rdcSessionID) => {
  const key = getSessionKey(rdcSessionID);

  return redis.lrange(key, 0, -1);
};

/**
 * Appends the loaded ids to those stored in redis.
 *
 * @param {string} rdcSessionID
 * @param {string[]} loadedIds
 * @returns {Promise} - the result of redis.expire
 */
api.append = async (rdcSessionID, loadedIds) => {
  const key = getSessionKey(rdcSessionID);

  await redis.rpush(key, loadedIds);
  return redis.expire(key, oneHourInSeconds);
};

/**
 * Gets the loaded ids from the locals object if it exists.  If not then it
 *   populates them first.
 *
 * @param {object} locals
 * @returns {Promise} - the loaded ids
 */
api.lazilyGetFromLocals = async (locals) => {
  await initLoadedIdsIfNecessary(locals);

  return locals.loadedIds;
};

/**
 * Appends newLoadedIds to locals.loadedIds and the redis store.
 *
 * Note: This method accounts for potential duplicates because curated content
 *   may have already been fetched from elasticsearch and thus will already
 *   be loaded.
 *
 * @param {string[]} loadedIds
 * @param {object} locals
 * @returns {Promise} - the result of api.append
 */
api.appendToLocalsAndRedis = async (loadedIds, locals) => {
  if (!_get(locals, 'rdcSessionID')) {
    throw new Error("locals must have a truthy property 'rdcSessionID'");
  }

  if (_isEmpty(loadedIds)) {
    return;
  }

  await initLoadedIdsIfNecessary(locals);

  const newLoadedIds = _difference(loadedIds, locals.loadedIds);

  if (_isEmpty(newLoadedIds)) {
    return;
  }

  locals.loadedIds = locals.loadedIds.concat(newLoadedIds);
  return api.append(locals.rdcSessionID, newLoadedIds);
};

module.exports = api;
