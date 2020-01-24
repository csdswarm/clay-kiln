'use strict';

const proxyquire = require('proxyquire'),
  { assert, expect } = require('chai'),
  sinon = require('sinon');

describe('cache tests', () => {
  const env = { ...process.env };

  function resetGlobals() {
    process.env = { ...env };
  }

  afterEach(resetGlobals);

  // generates standard proxies for required components used by cache
  function requireCacheStandard({ get, set, del, log, redisClassSpy = () => {} }) {
    return proxyquire('./cache', {
      ioredis: function (name, options) {
        redisClassSpy(name, options);
        Object.assign(this, { get, set, del });
      },
      '../universal/log': {
        setup() {
          return log;
        }
      }
    });
  }

  describe('initialization', () => {
    it('creates a new ioredis instance using environment variables', () => {
      process.env.REDIS_HOST = 'www.host-redis.com';
      process.env.REDIS_DB = 'local-clay';

      const redisClassSpy = sinon.spy();

      requireCacheStandard({ redisClassSpy });

      assert(redisClassSpy.calledWithMatch(
        'www.host-redis.com',
        { keyPrefix: 'local-clay-unity-cache:', db: 1 }));
    });
  });

  describe('set', () => {

    it('sets a value in the redis cache', async () => {
      const setSpy = sinon.spy(),
        cache = requireCacheStandard({ set: setSpy });

      await cache.set('SOME KEY', 'A TEXT VALUE', 1000);

      assert(setSpy.calledWith('SOME KEY', 'A TEXT VALUE', 'EX', 1000));
    });

    it('handles errors', async () => {
      const set = sinon.stub().throws(new Error('Could not set stuff')),
        logSpy = sinon.spy(),
        cache = requireCacheStandard({ log: logSpy, set });

      await cache.set('stuff', 'things', 100);
      assert(logSpy.calledWith(
        'error',
        'There was an error trying to set cache for key:"stuff" to value:"things"'
      ));
      expect(logSpy.args[0][2].toString()).to.equal('Error: Could not set stuff');
    });
  });


  describe('get', () => {

    it('gets a value from the redis cache', async () => {
      const getSpy = sinon.stub().returns('RESULT VALUE'),
        cache = requireCacheStandard({ get: getSpy }),
        result = await cache.get('THE KEY');

      expect(result).to.equal('RESULT VALUE');
      assert(getSpy.calledWith('THE KEY'));
    });

    it('handles errors', async () => {
      const get = sinon.stub().throws(new Error('Could not get things')),
        logSpy = sinon.spy(),
        cache = requireCacheStandard({ log: logSpy, get });

      await cache.get('stuff');
      assert(logSpy.calledWith(
        'error',
        'There was an error trying to get cache for key:stuff'
      ));
      expect(logSpy.args[0][2].toString()).to.equal('Error: Could not get things');
    });
  });


  describe('del', () => {

    it('deletes a value from the redis cache', async () => {
      const delSpy = sinon.spy(),
        cache = requireCacheStandard({ del: delSpy });

      await cache.del('DELETE THIS');

      assert(delSpy.calledWith('DELETE THIS'));
    });

    it('handles errors', async () => {
      const del = sinon.stub().throws(new Error('Could not delete that key')),
        logSpy = sinon.spy(),
        cache = requireCacheStandard({ log: logSpy, del });

      await cache.del('DELETE KEY');

      assert(logSpy.calledWith(
        'error',
        'There was an error trying to delete cache for key:"DELETE KEY"'
      ));
      expect(logSpy.args[0][2].toString()).to.equal('Error: Could not delete that key');
    });
  });
});
