'use strict';

/**
 * Note
 * - I decided against making a new service where rdcSessionID is held in scope
 *   because of the simplicity of this service.  Should it get larger, I would
 *   rename this to 'make-loaded-ids-service' with a function that takes a
 *   rdcSessionID and returns the api to remove the redundancy of passing in
 *   rdcSessionID all the time.
 *
 *   Also, all these return the raw redis results in case they're needed.  I
 *   don't suspect they will be useful though.
 */

const _get = require('lodash/get'),
  redis = require('./redis'),
  api = {},
  getSessionKey = rdcSessionID => rdcSessionID + ':loaded-ids',
  oneHourInSeconds = 1000 * 60 * 60;

/**
 * Deletes the redis key associated with the loaded ids
 *
 * @param {string} rdcSessionID
 * @returns {Promise}
 */
api.clear = (rdcSessionID) => {
  const key = getSessionKey(rdcSessionID);

  return redis.del(key);
};

/**
 * Gets the loaded ids from redis
 *
 * @param {string} rdcSessionID
 * @returns {Promise}
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
 * @returns {Promise}
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
 * @returns {Promise}
 */
api.lazilyGetFromLocals = async (locals) => {
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

  return locals.loadedIds;
};

module.exports = api;
