'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { expect } = require('chai'),
  { unityAppDomain } = require('../../universal/urps');


describe('getPermissions', () => {
  const mockUrpsPermissions = [{ some: 'permission' }],
    getFromUrps = sinon.spy(() => ({ data: mockUrpsPermissions })),
    createUnityPermissions = sinon.spy(),
    idToken = 'idToken',
    stationDomainNames = [unityAppDomain],
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
      { domains: [unityAppDomain, ...stationDomainNames] },
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
