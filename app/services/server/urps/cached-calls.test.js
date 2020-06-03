'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { expect } = require('chai'),
  { PERM_CHECK_INTERVAL } = require('./utils');

describe('cachedCalls', () => {
  const mockDomains = [{ some: 'domain' }],
    getFromUrps = sinon.spy(() => ({ data: mockDomains })),
    cachedCalls = proxyquire('./cached-calls', {
      './get-from-urps': getFromUrps
    });

  afterEach(() => {
    getFromUrps.resetHistory();
  });

  it('invokes getFromUrps with the correct arguments', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { urlPath, urpsReqBody } = aCachedCall.metaData,
        mockToken = '';

      await aCachedCall({ token: mockToken });

      expect(getFromUrps.calledTwice).to.be.true;
      expect(getFromUrps.firstCall.args).to.deep.equal([
        urlPath,
        Object.assign({ domainType: 'station' }, urpsReqBody),
        mockToken
      ]);
      expect(getFromUrps.secondCall.args).to.deep.equal([
        urlPath,
        Object.assign({ domainType: 'market' }, urpsReqBody),
        mockToken
      ]);

      getFromUrps.resetHistory();
    }
  });

  it('invokes getFromUrps when lastUpdated has expired', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByCachedPropName: {
            [cachedPropName]: Date.now() - PERM_CHECK_INTERVAL - 1000
          }
        };

      await aCachedCall(auth);

      expect(getFromUrps.calledTwice).to.be.true;

      getFromUrps.resetHistory();
    }
  });

  it('does not invoke getFromUrps when lastUpdated is fresh', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByCachedPropName: {
            [cachedPropName]: Date.now()
          }
        };

      await aCachedCall(auth);

      expect(getFromUrps.called).to.be.false;

      getFromUrps.resetHistory();
    }
  });

  it('invokes getFromUrps when isRefresh is true', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByCachedPropName: {
            [cachedPropName]: Date.now()
          }
        };

      await aCachedCall(auth, { isRefresh: true });

      expect(getFromUrps.calledTwice).to.be.true;

      getFromUrps.resetHistory();
    }
  });
});
