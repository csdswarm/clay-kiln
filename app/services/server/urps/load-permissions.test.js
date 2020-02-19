'use strict';

const proxyquire = require('proxyquire'),
  sinon = require('sinon'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  { expect } = require('chai');

const rdcDomainName = DEFAULT_STATION.urpsDomainName,
  delta = 100;

describe('loadPermissions', () => {
  const getPermissions = sinon.spy(() => ({
      [rdcDomainName]: {}
    })),
    loadPermissions = proxyquire('./load-permissions', {
      './get-permissions': getPermissions
    }),
    getMockData = ({ permissions }) => ({
      auth: {
        token: {},
        permissions
      },
      stationDomainNames: [rdcDomainName]
    });

  beforeEach(() => {
    getPermissions.resetHistory();
  });

  it('getPermissions is called with the correct arguments', async () => {
    const { auth, stationDomainNames } = getMockData({ permissions: {} });

    await loadPermissions(auth, stationDomainNames);

    expect(getPermissions.calledOnce).to.be.true;
    expect(getPermissions.firstCall.args).to.deep.equal([
      auth.token,
      stationDomainNames
    ]);
  });

  it('lastUpdatedByStationDomainName is set as expected', async () => {
    const { auth, stationDomainNames } = getMockData({ permissions: {} }),
      now = Date.now();

    await loadPermissions(auth, stationDomainNames);

    expect(auth.lastUpdatedByStationDomainName[rdcDomainName]).to.be.closeTo(now, delta);
  });

  it('auth.permissions is updated', async () => {
    const { auth, stationDomainNames } = getMockData({ permissions: {
      'some other station domain name': {}
    } });

    await loadPermissions(auth, stationDomainNames);

    expect(auth.permissions).to.deep.equal({
      [rdcDomainName]: {},
      'some other station domain name': {}
    });
  });
});
