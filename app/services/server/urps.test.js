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
      locals = { user: {} },
      recently = Date.now() - 100,
      inTheSignificantFuture = recently + 10000000,
      authBase = {
        token: 'some-token-that-would-be-a-jwt-and-should-be-if-we-are-testing-that',
        expires: inTheSignificantFuture,
        lastUpdated: recently
      };

    // prevent changes to authBase, use spread operator to extend
    // e.g. myAuth = {...authBase, token: 'some-real-jwt-token-maybe'}
    Object.freeze(authBase);

    function resetGlobals() {
      req.session = {};
      locals.user = {};
    }

    // generates standard proxies for required components used by loadPermissions
    function requireUrpsLoadPermsStandard(options) {
      const { cacheResults, cacheDel, invokeError, restGetResults, refreshAuthToken, log } = options;

      return proxyquire('./urps', {
        '../universal/rest': {
          get: async () => restGetResults
        },
        './cache': {
          get: invokeError ? sinon.stub().throws('cache problems') : async () => cacheResults,
          del: cacheDel || (() => {}),
          '@noCallThru': true // cache attempts to create a new ioredis immediately on reference, so never call it
        },
        '../universal/log': {
          setup() {
            return log || (() => {});
          }
        },
        './cognito': {
          refreshAuthToken: refreshAuthToken || (() => {})
        },
        '../universal/constants': {
          time: { MINUTE: 60000 }
        }
      });
    }

    it('loads existing permissions from the session cache', async () => {
      const urps = requireUrpsLoadPermsStandard({
        cacheResults: '',
        log: console.log
      });

      resetGlobals();

      req.session.auth = {
        ...authBase,
        permissions: { admin: { any: { environment: { 'dev-clay.radio.com': 1 } } } }
      };

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql(req.session.auth.permissions);
    });

    it('gets permissions from urps if not already cached in session', async () => {
      const restGetResults = [{ type: 'author-page', action: 'any', target: { type: 'station', value: 'NATL-RC' } }],
        urps = requireUrpsLoadPermsStandard({ restGetResults });

      resetGlobals();

      req.session.auth = { ...authBase };

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql({ 'author-page': { any: { station: { 'NATL-RC': 1 } } } });
    });

    it('refreshes permissions from urps if it\'s been too long since the last check', async () => {
      const longAgo = Date.now() - 100000000,
        restGetResults = [{ type: 'tags', action: 'create', target: { type: 'station', value: 'KROQFM' } }],
        urps = requireUrpsLoadPermsStandard({ restGetResults });

      resetGlobals();

      req.session.auth = { ...authBase, lastUpdated: longAgo };

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql({ tags: { create: { station: { KROQFM: 1 } } } });

    });

    it('refreshes the user token if it has exceeded its expiration', async () => {
      const inThePast = Date.now() - 1000,
        refreshAuthToken = sinon.spy(),
        urps = requireUrpsLoadPermsStandard({ refreshAuthToken });

      resetGlobals();

      req.session.auth = {
        ...authBase,
        expires: inThePast,
        permissions: { 'doesn\'t': { really: { matter: { here: 1 } } } }
      };

      await urps.loadPermissions(req.session, locals.user);

      assert(refreshAuthToken.calledWith(req.session.auth));

    });

    it('handles no auth on session', async () => {
      const cacheResults = JSON.stringify({ ...authBase }),
        restGetResults = [
          { type: 'tags', action: 'create', target: { type: 'station', value: 'NATL-RC' } },
          { type: 'tags', action: 'update', target: { type: 'station', value: 'NATL-RC' } }
        ],
        urps = requireUrpsLoadPermsStandard({ cacheResults, restGetResults });

      resetGlobals();

      await urps.loadPermissions(req.session, locals.user);

      expect(locals.user.permissions).to.eql({
        tags: {
          create: { station: { 'NATL-RC': 1 } },
          update: { station: { 'NATL-RC': 1 } }
        }
      });
    });

    it('handles errors', async () => {
      const
        log = sinon.spy(),
        restGetResults = { message: 'There was a problem' },
        urps = requireUrpsLoadPermsStandard({
          restGetResults,
          invokeError: true,
          log
        });

      resetGlobals();

      locals.user.username = 'jschmoe@idaho.gov';

      await urps.loadPermissions(req.session, locals.user);

      // note: also called with error, but specific error stack too difficult to
      // replicate here, so just checking the first two params
      assert(log.calledWith(
        'error',
        'There was an error attempting to load user permissions for jschmoe@idaho.gov.'
      ));
    });

  });
});
