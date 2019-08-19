'use strict';

const util = require('util'),
  log = require('../universal/log').setup({ file: __filename }),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST, {
    keyPrefix: `${(process.env.REDIS_DB ? process.env.REDIS_DB + '-' : '')}unity-cache:`,
    db: 1
  });

async function set(key, value, ttlSeconds) {
  try {
    return await util.promisify(redis.set).bind(redis)(key, value, 'EX', ttlSeconds);
  } catch (error) {
    log('error', `There was an error trying to set cache for key:"${key}" to value:"${value}"`, error)
  }
}

async function get(key) {
  try {
    return await util.promisify(redis.get).bind(redis)(key);
  } catch (error) {
    log('error', `There was an error trying to get cache for key:${key}`, error)
  }
}

module.exports = {
  get,
  set
};
