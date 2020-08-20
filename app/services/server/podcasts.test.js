'use strict';
process.env.CLAY_SITE_PROTOCOL = 'http';
process.env.CLAY_SITE_HOST = 'testing-clay.radio.com';
const
  chai = require('chai'),
  podcastUtils = require('./podcasts'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,

  mockData = {
    stations: {
      byId: {
        409: {
          id: 409,
          name: '92-9 The Game',
          site_slug: '929thegame'
        }
      }
    },
    apiResponse: {
      meta: {
        count: 1
      },
      data: [
        {
          id: 8,
          attributes: {
            site_slug: 'the-morning-show-w-john-and-hugh-8',
            station: [
              {
                id: 409,
                name: '92-9 The Game'
              }
            ]
          },
          links: {
            self: 'http://api.radio.com/v1/podcasts/8'
          }
        }
      ],
      links: {
        self: 'http://api.radio.com/v1/podcasts?filter[id]=46%2C51%2C8%2C853%2C100%2C107%2C11&page[number]=1&page[size]=10',
        last: 'http://api.radio.com/v1/podcasts?filter%5Bid%5D=46%2C51%2C8%2C853%2C100%2C107%2C11&page%5Bnumber%5D=1&page%5Bsize%5D=10',
        first: 'http://api.radio.com/v1/podcasts?filter%5Bid%5D=46%2C51%2C8%2C853%2C100%2C107%2C11&page%5Bnumber%5D=1&page%5Bsize%5D=10'
      }
    },
    dbResponse: {
      rows: [{
        id: 'testing-clay.radio.com/_podcasts/100',
        data: {
          id: 100,
          url: 'https://clay.radio.com/wwjnewsradio/podcasts/automotive-insight-100',
          type: 'podcast',
          links: {
            self: 'http://api.radio.com/v1/podcasts/100'
          },
          updated: '2020-07-29T22:41:41.464Z',
          attributes: {
            station: [
              {
                id: 447,
                name: 'WWJ Newsradio 950'
              }
            ]
          }
        }
      }]
    }
  },
  radioApiGetParams = [
    'podcasts',
    sinon.match.hasNested('page.size')
      .and(sinon.match.hasNested('page.number')),
    null,
    { ttl: 0 },
    {}];


chai.use(sinonChai);


describe('server/podcasts', () => {
  afterEach(sinon.restore);

  describe('updatePodcasts', () => {
    /**
     *
     * @param {boolean} opts[isStale] whether or not the current mock data should be considered stale
     * @param {object} opts[dbResponse] returns the value you pass as a response from the db
     * @param {boolean} opts[rdcApiThrows] Whether or not the radioApiGet function should throw an error
     * @returns {Promise<{}>}
     */
    async function setup_updatePodcasts(opts = {}) {
      const { _internals: __, updatePodcasts: update } = podcastUtils,
        updatePodcasts = sinon.spy(update);

      __.dbRaw = sinon.stub();
      __.getStationsById = sinon.stub();
      __.log = sinon.stub();
      __.moment = sinon.stub();
      __.radioApiGet = sinon.stub();

      __.dbRaw.resolves(opts.dbResponse || mockData.dbResponse);
      __.getStationsById.resolves(mockData.stations.byId);

      if (opts.rdcApiThrows) {
        __.radioApiGet.throws(() => {
          return new Error('TESTING - Failed to connect to RDC API');
        });
      } else {
        __.radioApiGet.resolves(mockData.apiResponse);
      }

      __.moment.returns({
        isAfter: sinon.stub().returns(opts.isStale),
        toISOString: sinon.stub()
      });

      await updatePodcasts({});
      return { __, updatePodcasts };
    }

    it('gets a single podcast from db', async () => {
      const { __ } = await setup_updatePodcasts();

      expect(__.dbRaw).to.have.been.calledWith(sinon.match(/SELECT.*podcasts.*LIMIT 1/s));
    });


    it('gets podcasts from the api if podcast db data is empty', async () => {
      const { __ } = await setup_updatePodcasts({ dbResponse: { rows: [] } });

      expect(__.radioApiGet).to.have.been.calledWith(...radioApiGetParams);
    });

    it('does not get podcasts from the api when podcast data is fresh', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: false, dbResponse: { rows: [{ id: 'mockItem', data: {} }] } });

      expect(__.radioApiGet).to.not.have.been.called;
    });

    it('gets podcasts from the api if podcast db data is stale', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: true });

      expect(__.radioApiGet).to.have.been.calledWith(...radioApiGetParams);
    });

    it('updates the db with fresh data when db data is stale', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: true });

      expect(__.dbRaw).to.have.been.calledWith(
        sinon.match(/INSERT INTO podcasts/),
        [
          sinon.match(/testing-clay.radio.com\/_podcasts\/\d+/), // "id" column for at least one row
          sinon.match.has('id') // data column should contain at least the id returned from RDC api
        ]
      );
    });

    it('adds the url to podcasts being added to db', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: true });

      expect(__.dbRaw).to.have.been.calledWith(
        sinon.match(/INSERT INTO podcasts/),
        [
          sinon.match(/testing-clay.radio.com\/_podcasts\/\d+/),
          sinon.match.has('url')
        ]
      );
    });

    it('adds the current datetime to \'updated\' property to podcasts being added to db', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: true });

      expect(__.dbRaw).to.have.been.calledWith(
        sinon.match(/INSERT INTO podcasts/),
        [
          sinon.match(/testing-clay.radio.com\/_podcasts\/\d+/),
          sinon.match.has('updated')
        ]
      );
    });

    it('gets station data when updating podcasts', async () => {
      const { __ } = await setup_updatePodcasts({ isStale: true });

      expect(__.getStationsById).to.have.been.called;
    });

    it('Handles errors thrown by radioApi gracefully', async () => {
      const { __, updatePodcasts } = await setup_updatePodcasts({ rdcApiThrows: true, isStale: true });

      expect(__.log).to.be.calledWith('error', sinon.match(/Failed to get podcasts from RDC API/));
      expect(updatePodcasts).not.to.have.thrown;
    });
  });
});
