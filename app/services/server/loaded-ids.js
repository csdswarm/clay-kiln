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
  getLoadedIdsSessionKey = rdcSessionID => rdcSessionID + ':loaded-ids',
  oneHourInSeconds = 1000 * 60 * 60;

/**
 * @param {string} rdcSessionID
 * @returns {Promise}
 */
api.clearLoadedIds = (rdcSessionID) => {
  const key = getLoadedIdsSessionKey(rdcSessionID);

  return redis.del(key);
};

/**
 * @param {string} rdcSessionID
 * @returns {Promise}
 */
api.getLoadedIds = (rdcSessionID) => {
  const key = getLoadedIdsSessionKey(rdcSessionID);

  return redis.lrange(key, 0, -1);
};

/**
 * @param {string} rdcSessionID
 * @param {string[]} loadedIds
 * @returns {Promise}
 */
api.appendLoadedIds = async (rdcSessionID, loadedIds) => {
  const key = getLoadedIdsSessionKey(rdcSessionID);

  await redis.rpush(key, loadedIds);
  return redis.expire(key, oneHourInSeconds);
};

/**
 * @param {object} locals
 * @returns {Promise}
 */
api.lazilyGetLoadedIdsFromLocals = async (locals) => {
  if (
    !_get(locals, 'loadedIds'),
    !_get(locals, 'rdcSessionID')
  ) {
    throw new Error(
      "locals must have either a truthy property 'loadedIds' or 'rdcSessionID'"
    );
  }

  if (!locals.loadedIds) {
    locals.loadedIds = await api.getLoadedIds(locals.rdcSessionID);
  }

  return locals.loadedIds;
};

module.exports = api;
