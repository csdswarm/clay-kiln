'use strict';

const log = require('../universal/log').setup({ file: __filename }),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST, {
    keyPrefix: `${(process.env.REDIS_DB ? process.env.REDIS_DB + '-' : '')}unity-cache:`,
    db: 1
  });

/**
 * Saves a string value with a key to the cache
 * @param {string} key - key to store information in
 * @param {string} value - value to store in redis, must be a string
 * @param {number} ttlSeconds time to remain in cache in seconds, not milliseconds
 * @returns {Promise<string>} 'OK' if successful
 */
async function set(key, value, ttlSeconds) {
  try {
    return await redis.set(key, value, 'EX', ttlSeconds);
  } catch (error) {
    log('error', `There was an error trying to set cache for key:"${key}" to value:"${value}"`, error);
  }
}

/**
 * Retrieves a string value belonging to a key in the cache
 * @param {string} key the key used to store the data
 * @returns {Promise<string>} The value from the cache, if it still exists
 */
async function get(key) {
  try {
    return await redis.get(key);
  } catch (error) {
    log('error', `There was an error trying to get cache for key:${key}`, error);
  }
}

/**
 * Deletes a key and value pair from the cache
 * @param {string} key the key used to store the data
 */
function del(key) {
  try {
    redis.del(key);
  } catch (error) {
    log('error', `There was an error trying to delete cache for key:"${key}"`, error);
  }
}

module.exports = {
  get,
  set,
  del
};
