'use strict';

const { expect } = require('chai'),
  { DEFAULT_STATION } = require('./constants'),
  rdcDomainName = DEFAULT_STATION.urpsDomainName,
  { getStationDomainName, getStationDomain } = require('./urps');

describe('getStationDomainName', () => {
  it('returns combination of stationName | stationSlug as domain name', () => {
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

  it('returns combination of station - ${core_id} as domain name', () => {
    const station = {
      id: 12,
      name: 'We are Channel Q',
      site_slug: 'wearechannelq',
      market: {
        id: 23
      }
    };

    expect(getStationDomainName(station)).to.eq(`${station.name} | ${station.site_slug}`);
  });
});

describe('getStationDomain', () => {
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
      id: 14 // national market id.
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
