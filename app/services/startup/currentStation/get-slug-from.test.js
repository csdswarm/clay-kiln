'use strict';

const
  getSlugFrom = require('./get-slug-from'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('startup', () => {
  afterEach(sinon.restore);

  describe('currentStation', () => {

    describe('get-slug-from', () => {
      function setup_getSlugFrom() {
        const { _internals: __, requestUrl } = getSlugFrom,
          stationSlugObj = sinon.spy({
            forCommonUse: null,
            forPermissions: null
          });

        sinon.spy(__, 'initBothSlugsTo');
        sinon.spy(__, 'getPotentialStationSlugFromReq');

        return { __,  requestUrl, stationSlugObj };
      }

      describe('requestUrl', () => {
        function setup_requestUrl() {
          const { __, requestUrl, stationSlugObj } = setup_getSlugFrom(),
            allStations = sinon.spy({
              bySlug: {
                'abc-123': { id: 123, name: 'ABC 12.3 FM', slug: 'abc-123', callsign: 'WABC' },
                'xyz-the-z': { id: 100, name: 'The Z - Country', slug: 'xyz-the-z', callsign: 'KXYZ' }
              }
            });

          return { __, requestUrl, allStations, stationSlugObj };
        }

        it('gets the slug if it\'s in the request url', () => {
          const { requestUrl, allStations, stationSlugObj } = setup_requestUrl();

          requestUrl(stationSlugObj, { allStations, req: { originalUrl: '/abc-123/music/stuff' } });
          expect(stationSlugObj.forPermissions).to.equal('abc-123');
          expect(stationSlugObj.forCommonUse).to.equal('abc-123');
        });

        it('gets the slug only if it is in the station list', () => {
          const { requestUrl, allStations, stationSlugObj } = setup_requestUrl();

          requestUrl(stationSlugObj, { allStations, req: { originalUrl: '/not-a-real-station/music/stuff' } });
          expect(stationSlugObj.forPermissions).to.equal(null);
          expect(stationSlugObj.forCommonUse).to.equal(null);
        });

        it('gets the slug when it is a station front that is being edited', () => {
          const { requestUrl, allStations, stationSlugObj } = setup_requestUrl();

          requestUrl(stationSlugObj, { allStations, req: { originalUrl: '/xyz-the-z?edit=true' } });
          expect(stationSlugObj.forPermissions).to.equal('xyz-the-z');
          expect(stationSlugObj.forCommonUse).to.equal('xyz-the-z');

        });
      });
    });
  });
});
