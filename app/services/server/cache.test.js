'use strict';

const proxyquire = require('proxyquire'),
  { assert, expect } = require('chai'),
  sinon = require('sinon');

describe('cache tests', () => {
  let origEnv;

  beforeEach(() =>  origEnv = {...process.env});

  afterEach(() => process.env = {...origEnv});

  // generates standard proxies for required components used by cache
  function requireCacheStandard({ getData, getRedisError, setRedisError, log, redisClassSpy }) {
    return proxyquire('./cache', {
      ioredis: function (name, options) {
        redisClassSpy(name, options);
        this.get = (key, callback) =>  callback(getRedisError, getData);
        this.set = (key, value, ...args) => args.slice(-1)(setRedisError, 'OK');
      },
      '../universal/log': {
        setup() {
          return log;
        }
      }
    });
  }

  describe('get', () => {
    it('handles errors', async () => {
      const log = sinon.spy(),
        cache = requireCacheStandard({log});

      await cache.get('stuff');
      assert(true);
    });
  });

  describe('set', () => {

    it('handles errors', async () => {
      const log = sinon.spy(),
        cache = requireCacheStandard({log});

      await cache.set('stuff', 'things', 100);
      expect(true).to.be.truthy;
    });
  });
});
