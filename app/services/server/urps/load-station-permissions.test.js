'use strict';

const proxyquire = require('proxyquire'),
  sinon = require('sinon'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  { expect } = require('chai'),
  { PERM_CHECK_INTERVAL } = require('./utils'),
  { nationalMarket } = require('../../universal/urps');

const rdcDomainName = DEFAULT_STATION.urpsDomainName;

describe('loadStationPermissions', () => {
  const loadPermissions = sinon.spy(),
    loadStationPermissions = proxyquire('./load-station-permissions', {
      './load-permissions': loadPermissions,
      './utils': { USE_URPS_CORE_ID: true }
    }),
    getMockData = opts => {
      const {
        lastUpdatedByStationDomainName,
        permissions
      } = opts;

      return {
        session: {
          auth: {
            permissions,
            lastUpdatedByStationDomainName
          }
        },
        locals: {
          stationForPermissions: DEFAULT_STATION,
          user: { username: 'mockuser@entercom.com' }
        }
      };
    };

  beforeEach(() => {
    loadPermissions.resetHistory();
  });

  it("loads permissions if the station hasn't been loaded yet", async () => {
    const { session, locals } = getMockData({ permissions: {} });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.calledOnce).to.be.true;
  });

  it('calls loadPermissions with the correct arguments', async () => {
    const { session, locals } = getMockData({ permissions: {} });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.firstCall.args).to.deep.equal([
      session.auth,
      [nationalMarket]
    ]);
  });

  it('calls loadPermissions with the correct arguments => USE_URPS_CODE_ID = false', async () => {
    const { session, locals } = getMockData({ permissions: {} }),
      loadStationPermissions = proxyquire('./load-station-permissions', {
        './load-permissions': loadPermissions,
        './utils': { USE_URPS_CORE_ID: false }
      });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.firstCall.args).to.deep.equal([
      session.auth,
      [rdcDomainName]
    ]);
  });

  it('loads permissions if the station has no lastUpdated entry', async () => {
    const permissions = { [rdcDomainName]: {} },
      lastUpdatedByStationDomainName = {},
      { session, locals } = getMockData({
        lastUpdatedByStationDomainName,
        permissions
      });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.calledOnce).to.be.true;
  });

  it('loads permissions if the station was last updated past the interval', async () => {
    const permissions = { [rdcDomainName]: {} },
      lastUpdatedByStationDomainName = {
        [rdcDomainName]: Date.now() - PERM_CHECK_INTERVAL - 1000
      },
      { session, locals } = getMockData({
        lastUpdatedByStationDomainName,
        permissions
      });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.calledOnce).to.be.true;
  });

  it("doesn't load permissions if the station was last updated within the interval", async () => {
    const permissions = { [rdcDomainName]: {} },
      lastUpdatedByStationDomainName = {
        [rdcDomainName]: Date.now() - PERM_CHECK_INTERVAL + 1000
      },
      { session, locals } = getMockData({
        lastUpdatedByStationDomainName,
        permissions
      });

    await loadStationPermissions(session, locals);

    expect(loadPermissions.notCalled).to.be.true;
  });
});
