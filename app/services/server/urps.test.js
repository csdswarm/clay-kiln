'use strict';

const proxyquire = require('proxyquire'),
  { assert, expect } = require('chai'),
  sinon = require('sinon');

describe('urps tests', () => {
  describe('getAllPermissions', () => {
    // generates standard proxies for required components used by getAllPermissions
    function requireUrpsGetAllPermsStandard({ restGetResults, invokeError, log }) {
      return proxyquire('./urps', {
        '../universal/rest': {
          get: invokeError ? sinon.stub().throws(restGetResults) : async () => restGetResults
        },
        './cache': {
          get: async () => null,
          '@noCallThru': true // cache attempts to create a new ioredis immediately on reference, so never call it
        },
        '../universal/log': {
          setup() {
            return log;
          }
        }
      });
    }

    it('returns all permissions in the form permission.action.targetType.target', async () => {
      const urps = requireUrpsGetAllPermsStandard({
          restGetResults: [
            { type: 'admin', action: 'any', target: { type: 'environment', value: 'dev-clay.radio.com' } },
            { type: 'author-page', action: 'any', target: { type: 'station', value: 'NATL-RC' } },
            { type: 'tags', action: 'create', target: { type: 'station', value: 'NATL-RC' } },
            { type: 'tags', action: 'update', target: { type: 'station', value: 'NATL-RC' } },
            { type: 'tags', action: 'create', target: { type: 'station', value: 'KROQFM' } },
            { type: 'content-collections', action: 'create', target: { type: 'station', value: 'NATL-RC' } },
            { type: 'gallery', action: 'create', target: { type: 'station', value: 'NATL-RC' } }
          ]
        }),
        fakeToken = 'ab-cd-1234',
        result = await urps.getAllPermissions(fakeToken);

      expect(result).to.eql({
        admin: { any: { environment: { 'dev-clay.radio.com': 1 } } },
        'author-page': { any: { station: { 'NATL-RC': 1 } } },
        tags: { create: { station: { 'NATL-RC': 1, KROQFM: 1 } }, update: { station: { 'NATL-RC': 1 } } },
        'content-collections': { create: { station: { 'NATL-RC': 1 } } },
        gallery: { create: { station: { 'NATL-RC': 1 } } }
      });
    });

    it('handles errors', async () => {
      const
        log = sinon.spy(),
        restGetResults = { message: 'There was a problem' },
        urps = requireUrpsGetAllPermsStandard({
          restGetResults,
          invokeError: true,
          log
        }),
        jwtToken = 'xy-z-555444333222',
        result = await urps.getAllPermissions(jwtToken);

      expect(result).to.be.undefined;
      assert(log.calledWith('error', 'There was a problem trying to get URPS permissions for the user',
        { error: restGetResults, jwtToken }));
    });
  });

  describe('loadPermissions', () => {
    const req = { session: {} },
      locals = { user: {} };

    function resetGlobals() {
      req.session = {};
      locals.user = {};
    }

    // generates standard proxies for required components used by loadPermissions
    function requireUrpsLoadPermsStandard({ cacheResults, invokeError, restGetResults, log }) {
      return proxyquire('./urps', {
        '../universal/rest': {
          get: async () => restGetResults
        },
        './cache': {
          get: invokeError ? sinon.stub().throws('cache problems') : async () => cacheResults,
          '@noCallThru': true // cache attempts to create a new ioredis immediately on reference, so never call it
        },
        '../universal/log': {
          setup() {
            return log;
          }
        }
      });
    }

    it('loads existing permissions from the session cache', async () => {
      const urps = requireUrpsLoadPermsStandard({});

      resetGlobals();

      req.session.auth = {
        permissions: { admin: { any: { environment: { 'dev-clay.radio.com': 1 } } } }
      };

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql(req.session.auth.permissions);
    });

    it('gets permissions from urps if not already cached in session', async () => {
      const restGetResults = [{ type: 'author-page', action: 'any', target: { type: 'station', value: 'NATL-RC' } }],
        urps = requireUrpsLoadPermsStandard({ restGetResults });

      resetGlobals();

      req.session.auth = { expires: Date.now() + 10000 }; // some time in the future;

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql({ 'author-page': { any: { station: { 'NATL-RC': 1 } } } });
    });
  });
});
