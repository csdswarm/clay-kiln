'use strict';

const log = require('../universal/log').setup({ file: __filename }),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST, {
    keyPrefix: `${(process.env.REDIS_DB ? process.env.REDIS_DB + '-' : '')}unity-cache:`,
    db: 1
  });

async function set(key, value, ttlSeconds) {
  try {
    return await redis.set(key, value, 'EX', ttlSeconds);
  } catch (error) {
    log('error', `There was an error trying to set cache for key:"${key}" to value:"${value}"`, error);
  }
}

async function get(key) {
  try {
    return await redis.get(key);
  } catch (error) {
    log('error', `There was an error trying to get cache for key:${key}`, error);
  }
}

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
