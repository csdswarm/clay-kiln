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
          bband: 'FM',
          callsign: 'WZGCFM',
          category: 'Sports',
          city: 'Atlanta',
          country: 'US',
          description: 'Listen to 92-9 The Game, Atlanta sports radio station. Never miss a story or breaking news alert! LISTEN LIVE at work or while you surf. 24/7 for FREE on RADIO.COM.',
          doubleclick_bannertag: 'ATL.SPORTS.WZGCFM',
          doubleclick_prerolltag: 'ATL.SPORTS.WZGCFM',
          facebook: 'https://www.facebook.com/929TheGame',
          format: 'Sports',
          frequency: '92.9',
          gmt_offset: -10,
          hero_image: null,
          interactive: true,
          interactive_stream_drift: 0,
          keywords: 'WZGCFM, Atlanta',
          latitude: 33.8444,
          listen_live_url: 'http://player.radio.com/listen/station/929-the-game',
          longitude: -84.4741,
          name: '92-9 The Game',
          napster_id: null,
          napster_station_type: null,
          nielsen_asset_id: 'WZGC-FM',
          nielsen_station_type: '2',
          observes_dst: true,
          partner: 'CBS',
          partner_id: 1,
          partner_name: 'Entercom',
          phonetic_name: 'Ninety Two Point Nine The Game',
          popularity: 151590,
          postal_code: '30361',
          primary_color: '#000000',
          r20id: 53,
          secondary_color: '#000000',
          site_slug: '929thegame',
          slogan: 'Atlanta SportsRadio',
          slug: '929-the-game',
          square_logo_large: 'https://images.radio.com/logos/WZGCFM.jpg',
          square_logo_small: 'https://images.radio.com/logos/WZGCFM.jpg',
          state: 'GA',
          status: 1,
          stream_provider_id: 3,
          stream_provider_name: 'Triton',
          stream_type: 'Interactive',
          tag_station_id: 18827,
          text_number: null,
          triton_id: 1581,
          triton_name: 'WZGCFM',
          twitter: '929thegame',
          website: 'https://929thegame.radio.com/',
          market: {
            id: 1,
            name: 'Atlanta, GA',
            display_name: 'Atlanta, GA'
          },
          activity: [],
          genre: [
            {
              id: 11,
              name: 'Sports'
            }
          ],
          mood: [],
          parent_stations: [],
          child_stations: [],
          station_stream: [
            {
              type: 'mp3',
              url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WZGCFM.mp3'
            },
            {
              type: 'aac',
              url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WZGCFMAAC.aac'
            }
          ],
          interactive_stream_url: 'https://entercom-sgrewind.streamguys1.com/entercom/409/playlist_dvr_range-',
          market_id: 1,
          market_name: 'Atlanta, GA',
          genre_name: [
            'Sports'
          ],
          activity_name: [],
          mood_name: [],
          timezone: 'ET'
        }
      }
    },
    apiResponse: {
      meta: {
        count: 1
      },
      data: [
        {
          type: 'podcast',
          id: 8,
          attributes: {
            description: 'The Morning Show w/ John and Hugh',
            explicit: null,
            image: 'https://images.radio.com/podcast/2D59B9B175C0F4AA0A5116D4A58C4245.jpg',
            keyword: null,
            popularity: 1000,
            rss_feed: 'https://www.omnycontent.com/d/playlist/4b5f9d6d-9214-48cb-8455-a73200038129/0a2f02fa-71a7-44ce-b9b3-a78b00e2fc68/2a976d56-e9a6-438c-af7c-a78b00e2fc68/podcast.rss',
            title: 'The Morning Show w/ John and Hugh',
            vanity_url: null,
            site_slug: 'the-morning-show-w-john-and-hugh-8',
            partner: {
              id: 1,
              name: 'Entercom'
            },
            stream_provider: {
              id: null,
              name: null
            },
            category: [
              {
                id: 31,
                name: 'Sports',
                slug: 'sports'
              }
            ],
            show: [
              {
                id: 1672,
                name: 'John and Hugh '
              }
            ],
            station: [
              {
                id: 409,
                name: '92-9 The Game',
                callsign: 'WZGCFM',
                market: {
                  id: 1,
                  name: 'Atlanta, GA'
                }
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
            show: [
              {
                id: 1034,
                name: 'Automotive Insight with John McElroy'
              }
            ],
            image: 'https://images.radio.com/podcast/8463005C8D59FAC0DEEE68B8FA4A82A7.jpg',
            title: 'Automotive Insight',
            keyword: null,
            partner: {
              id: 1,
              name: 'Entercom'
            },
            station: [
              {
                id: 447,
                name: 'WWJ Newsradio 950',
                market: {
                  id: 7,
                  name: 'Detroit, MI'
                },
                callsign: 'WWJAM'
              }
            ],
            category: [
              {
                id: 4,
                name: 'News',
                slug: 'news'
              }
            ],
            explicit: null,
            rss_feed: 'https://www.omnycontent.com/d/playlist/4b5f9d6d-9214-48cb-8455-a73200038129/a4088b85-1a2b-414e-885b-a78e00378721/6f049d1b-7a2f-418c-b3ff-a78e00378726/podcast.rss',
            site_slug: 'automotive-insight-100',
            popularity: 1632,
            vanity_url: null,
            description: 'with John McElroy',
            stream_provider: {
              id: null,
              name: null
            }
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
    async function setup_updatePodcasts(opts = {}) {
      const { _internals: __, updatePodcasts } = podcastUtils;

      __.moment = sinon.stub();
      __.dbRaw = sinon.stub();
      __.radioApiGet = sinon.stub();
      __.getStationsById = sinon.stub();

      __.dbRaw.resolves(opts.dbResponse || mockData.dbResponse);
      __.radioApiGet.resolves(mockData.apiResponse);
      __.getStationsById.resolves(mockData.stations.byId);

      __.moment.returns({
        isAfter: sinon.stub().returns(opts.isStale),
        toIsoString: sinon.stub()
      });

      await updatePodcasts({});
      return { __ };
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

  });
});
