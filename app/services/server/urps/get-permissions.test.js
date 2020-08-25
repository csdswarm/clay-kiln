'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { expect } = require('chai'),
  { unityAppDomain, unityAppDomainName } = require('../../universal/urps');


describe('getPermissions', () => {
  const mockUrpsPermissions = [{ some: 'permission' }],
    getFromUrps = sinon.spy(() => ({ data: mockUrpsPermissions })),
    createUnityPermissions = sinon.spy(),
    USE_URPS_CORE_ID = true,
    idToken = 'idToken',
    stationDomainNames = [unityAppDomain],
    getPermissions = proxyquire('./get-permissions', {
      './get-from-urps': getFromUrps,
      './utils': { createUnityPermissions, USE_URPS_CORE_ID }
    });

  beforeEach(() => {
    getFromUrps.resetHistory();
    createUnityPermissions.resetHistory();
  });

  it('getFromUrps is called with the correct arguments => USE_URPS_CORE_ID = true', async () => {
    await getPermissions(idToken, stationDomainNames);

    expect(getFromUrps.calledOnce).to.be.true;
    expect(getFromUrps.firstCall.args).to.deep.equal([
      '/permissions/by-domain',
      { domains: [unityAppDomain, ...stationDomainNames] },
      idToken
    ]);
  });

  it('getFromUrps is called with the correct arguments => USE_URPS_CORE_ID = false', async () => {
    const getPermissions = proxyquire('./get-permissions', {
      './get-from-urps': getFromUrps,
      './utils': { createUnityPermissions, USE_URPS_CORE_ID: false }
    });
    
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
