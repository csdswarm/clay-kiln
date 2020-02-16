'use strict';

const proxyquire = require('proxyquire'),
  { expect } = require('chai'),
  sinon = require('sinon'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  { PERM_CHECK_INTERVAL } = require('./utils'),
  rdcDomainName = DEFAULT_STATION.urpsDomainName;

describe('loadStationPermissions', () => {
  const loadPermissions = sinon.spy(),
    loadStationPermissions = proxyquire('./load-station-permissions', {
      './load-permissions': loadPermissions
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
