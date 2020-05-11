'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  _mapValues = require('lodash/mapValues'),
  _set = require('lodash/set'),
  { expect } = require('chai'),
  sinon = require('sinon'),
  cachedCallsOrig = require('./cached-calls'),
  { PERM_CHECK_INTERVAL } = require('./utils'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  rdcDomainName = DEFAULT_STATION.urpsDomainName;

describe('cachedCalls', () => {
  const loadPermissions = sinon.spy(),
    cachedCalls = getSpyCachedCalls(),
    refreshPermissions = proxyquire('./refresh-permissions', {
      './cached-calls': cachedCalls,
      './load-permissions': loadPermissions
    }),
    allSpies = [loadPermissions, ...Object.values(cachedCalls)],
    cachedPropNames = Object.values(cachedCallsOrig).reduce(
      (res, aCachedCall) => {
        res.push(aCachedCall.metaData.cachedPropName);
        return res;
      },
      []
    );

  afterEach(() => {
    allSpies.forEach(spy => spy.resetHistory());
  });

  it('cachedCalls are called with the correct arguments', async () => {
    const fresh = cachedPropNames.reduce(
        (res, aCachedPropName) => _set(res, aCachedPropName, Date.now()),
        {}
      ),
      auth = { lastUpdatedByCachedPropName: fresh };

    await refreshPermissions(auth);

    for (const cachedCallSpy of Object.values(cachedCalls)) {
      expect(cachedCallSpy.calledOnce).to.be.true;
      expect(cachedCallSpy.firstCall.args).to.deep.equal([
        auth,
        { isRefresh: true }
      ]);
    }
  });

  it('expired cachedCalls are not called', async () => {
    const aCachedCall = cachedCalls.getDomainNamesIHaveAccessTo,
      { cachedPropName } = aCachedCall.metaData,
      auth = { lastUpdatedByCachedPropName: {
        [cachedPropName]: getExpiredMs()
      } };

    await refreshPermissions(auth);

    expect(aCachedCall.called).to.be.false;
  });

  it('loadPermissions is called with the correct arguments', async () => {
    const fresh = { [rdcDomainName]: Date.now() },
      auth = { lastUpdatedByStationDomainName: fresh };

    await refreshPermissions(auth);

    expect(loadPermissions.calledOnce).to.be.true;
    expect(loadPermissions.firstCall.args).to.deep.equal([
      auth,
      [rdcDomainName]
    ]);
  });

  it('expired domain names are not refreshed', async () => {
    const auth = { lastUpdatedByStationDomainName: {
      [rdcDomainName]: getExpiredMs()
    } };

    await refreshPermissions(auth);

    expect(loadPermissions.firstCall.args).to.deep.equal([auth, []]);
  });
});

// helper fns

function getSpyCachedCalls() {
  return _mapValues(
    cachedCallsOrig,
    origCachedCall => Object.assign(
      sinon.spy(),
      { metaData: origCachedCall.metaData }
    )
  );
}

function getExpiredMs() {
  return Date.now() - PERM_CHECK_INTERVAL - 1000;
}
