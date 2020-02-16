'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  { expect } = require('chai'),
  sinon = require('sinon'),
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

  it('getFromUrps is called with the correct arguments', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { urlPath, urpsReqBody } = aCachedCall.metaData,
        mockToken = '';

      await aCachedCall({ token: mockToken });

      expect(getFromUrps.calledOnce).to.be.true;
      expect(getFromUrps.firstCall.args).to.deep.equal([
        urlPath,
        urpsReqBody,
        mockToken
      ]);

      getFromUrps.resetHistory();
    }
  });

  it('getFromUrps is called when lastUpdated has expired', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName, urlPath } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByUrlPath: {
            [urlPath]: Date.now() - PERM_CHECK_INTERVAL - 1000
          }
        };

      await aCachedCall(auth);

      expect(getFromUrps.calledOnce).to.be.true;

      getFromUrps.resetHistory();
    }
  });

  it('getFromUrps is not called when lastUpdated is fresh', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName, urlPath } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByUrlPath: {
            [urlPath]: Date.now()
          }
        };

      await aCachedCall(auth);

      expect(getFromUrps.called).to.be.false;

      getFromUrps.resetHistory();
    }
  });

  it('getFromUrps is called when isRefresh is true', async () => {
    for (const aCachedCall of Object.values(cachedCalls)) {
      const { cachedPropName, urlPath } = aCachedCall.metaData,
        auth = {
          [cachedPropName]: {},
          lastUpdatedByUrlPath: {
            [urlPath]: Date.now()
          }
        };

      await aCachedCall(auth, { isRefresh: true });

      expect(getFromUrps.calledOnce).to.be.true;

      getFromUrps.resetHistory();
    }
  });
});
