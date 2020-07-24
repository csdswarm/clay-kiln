'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  { expect } = require('chai'),
  { unityAppDomainName } = require('../../universal/urps');

const rdcDomainName = DEFAULT_STATION.urpsDomainName;

describe('getPermissions', () => {
  const mockUrpsPermissions = [{ some: 'permission' }],
    getFromUrps = sinon.spy(() => ({ data: mockUrpsPermissions })),
    createUnityPermissions = sinon.spy(),
    idToken = 'idToken',
    stationDomainNames = [rdcDomainName],
    getPermissions = proxyquire('./get-permissions', {
      './get-from-urps': getFromUrps,
      './utils': { createUnityPermissions }
    });

  beforeEach(() => {
    getFromUrps.resetHistory();
    createUnityPermissions.resetHistory();
  });

  it('getFromUrps is called with the correct arguments', async () => {
    await getPermissions(idToken, stationDomainNames);

    expect(getFromUrps.calledOnce).to.be.true;
    expect(getFromUrps.firstCall.args).to.deep.equal([
      '/permissions/by-domain',
      { domains: [unityAppDomainName, ...stationDomainNames] },
      idToken
    ]);
  });

  it('createUnityPermissions is called with the correct arguments', async () => {
    await getPermissions(idToken, stationDomainNames);

    expect(createUnityPermissions.calledOnce).to.be.true;
    expect(createUnityPermissions.firstCall.args).to.deep.equal([
      mockUrpsPermissions
    ]);
  });
});
