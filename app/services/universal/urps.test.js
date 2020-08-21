'use strict';

const { expect } = require('chai'),
  proxyquire = require('proxyquire'),
  sinon = require('sinon'),
  { DEFAULT_STATION } = require('./constants'),
  rdcDomainName = DEFAULT_STATION.urpsDomainName;

let sandbox;

describe('getStationDomainName', () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('When USE_URPS_CORE_ID is false', () => {
    const { getStationDomainName } = proxyquire('./urps', { '../server/urps/utils' : {
      USE_URPS_CORE_ID: false
    } });

    it('returns National as domain name when is RDC', () => {
      const station = {
        id: 0,
        name: 'Radio.com',
        site_slug: '',
        urpsDomainName: 'National',
        market: {
          id: 15
        }
      };

      expect(getStationDomainName(station)).to.eq(rdcDomainName);
    });
  
    it('returns name | slug as domain name', () => {
      const station = {
        id: 12,
        name: 'We are Channel Q',
        site_slug: 'wearechannelq',
        market: {
          id: 23
        }
      };

      expect(getStationDomainName(station)).to.eq('We are Channel Q | wearechannelq');
    });
  });

  describe('When USE_URPS_CORE_ID is true', () => {
    const { getStationDomainName } = proxyquire('./urps', { '../server/urps/utils' : {
      USE_URPS_CORE_ID: true
    } });

    it('returns combination of market - ${core_id} as domain name', () => {
      const station = {
        id: 0,
        name: 'Radio.com',
        site_slug: '',
        urpsDomainName: 'National',
        market: {
          id: 15
        }
      };

      expect(getStationDomainName(station)).to.eq('market - 15');
    });
  
    it('returns combination of station - ${core_id} as domain name', () => {
      const station = {
        id: 12,
        name: 'We are Channel Q',
        site_slug: 'wearechannelq',
        market: {
          id: 23
        }
      };

      expect(getStationDomainName(station)).to.eq('station - 12');
    });
  });
});

describe('getStationDomain', () => {
  const { getStationDomain } = proxyquire('./urps', { '../server/urps/utils' : {
    USE_URPS_CORE_ID: false
  } });

  it('returns an object with market and id for RDC', () => {
    const station = {
      id: 0,
      name: 'Radio.com',
      site_slug: '',
      urpsDomainName: 'National',
      market: {
        id: 15
      }
    };

    expect(getStationDomain(station)).to.eql({
      type: 'market',
      id: 15
    });
  });

  it('returns an object with station and id for Stations', () => {
    const station = {
      id: 12,
      name: 'We Are Channel Q',
      site_slug: 'wearechannelq',
      market: {
        id: 15
      }
    };

    expect(getStationDomain(station)).to.eql({
      type: 'station',
      id: 12
    });
  });
});
