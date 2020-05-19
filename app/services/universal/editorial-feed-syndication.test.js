'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  proxyquire = require('proxyquire'),
  { addStationsByEditorialGroup } = proxyquire('./editorial-feed-syndication', {
    './rest': {
      get: () => Promise.resolve(mockData.editorialGroups)
    }
  }),
  mockData = {
    data: {
      primaryHeadline: '',
      headline: '',
      subHeadline: '',
      feedImgUrl: '',
      feedLayout: 'small',
      teaser: '',
      slug: '',
      byline: [{ prefix: 'by', names: [], sources: [] }],
      syndicatedUrl: '',
      corporateSyndication: [],
      stationSyndication: [],
      genreSyndication: [],
      syndicationStatus: 'original',
      lead: [],
      content:
        [{ _ref: 'clay.radio.com/_components/paragraph/instances/new' }],
      tags: { _ref: 'clay.radio.com/_components/tags/instances/new' },
      adTags: { _ref: 'clay.radio.com/_components/ad-tags/instances/new' },
      contentPageSponsorLogo:
        { _ref: 'clay.radio.com/_components/google-ad-manager/instances/contentPageLogoSponsorship' },
      sideShare: { _ref: 'clay.radio.com/_components/share/instances/new' },
      feeds:
      {
        sitemaps: true,
        rss: true,
        'most-popular': true,
        newsfeed: true,
        'apple-news': true
      },
      secondarySectionFront: '',
      showSocial: true,
      authors: [],
      sources: [],
      canBeMarkedGoogleStandout: true,
      availableStandoutArticleInventory: true,
      articleWithinGoogleStandoutPublishDateLimit: true,
      rollingStandoutCount: 0,
      componentVariation: 'article',
      empty: '<span class=\\"circulation--empty\\">None</span>',
      pageTitle: '',
      plaintextPrimaryHeadline: '',
      sectionFront: '',
      contentType: 'article',
      featured: false,
      editorialFeeds: {},
      isContentFromAP: false,
      noIndexNoFollow: false,
      dateModified: '2019-08-21T15:22:46.364Z'
    },
    locals: {
      radiumUser: null,
      ENTERCOM_DOMAINS: [
        'radio.com'
      ],
      station: {
        id: 0,
        name: 'Radio.com',
        callsign: 'NATL-RC',
        website: 'https://www.radio.com',
        slug: 'www',
        square_logo_small: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
        square_logo_large: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
        city: 'New York',
        state: 'NY',
        country: 'US',
        gmt_offset: -5,
        market: {
          id: 15,
          name: 'New York, NY'
        },
        category: ''
      },
      lytics: {
        uid: '1234'
      },
      user: {
        auth: 'admin',
        name: 'joe schmoe',
        imageUrl: '',
        provider: 'google',
        username: 'joe.schmoe@entercom.com'
      },
      url: 'http://clay.radio.com/news/national-news/duplicate-slug-test?edit=true',
      site: {
        name: 'Clay Demo',
        host: 'clay.radio.com',
        path: '',
        assetDir: 'public',
        assetPath: '',
        port: 80,
        protocol: 'http',
        shortKey: 'cd',
        webPlayerHost: '/web-player',
        brightcoveAccountId: 1234,
        brightcovePlayerId: '1234',
        googleContainerId: '1234',
        verizonMediaCompanyId: '1234',
        verizonMediaPlayerId: '1234',
        slug: 'demo',
        dir: '/usr/src/app/sites/demo',
        prefix: 'clay.radio.com',
        providers: [
          'apikey',
          'google'
        ],
        resolvePublishUrl: [
          null,
          null,
          null
        ],
        modifyPublishedData: [
          null
        ]
      },
      edit: 'true',
      routes: [],
      components: [],
      params: {
        year: 'news',
        month: 'national-news',
        name: 'duplicate-slug-test'
      },
      query: {
        edit: 'true'
      },
      extension: 'html'
    },
    editorialGroups: [
      {
        id: 1,
        data: {
          feeds: {
            'Hot AC': true,
            Country: true,
            Trending: true,
            'Hot AC / Top 40 / CHR': true
          },
          market: 'Atlanta, GA',
          callsign: 'WSTRFM',
          siteSlug: 'star941atlanta',
          stationName: 'Atlanta\'s Star 94.1'
        }
      },
      {
        id: 2,
        data: {
          feeds: {
            Urban: true,
            'Hip Hop': true,
            Trending: true
          },
          market: 'Atlanta, GA',
          callsign: 'WVEEFM',
          siteSlug: 'v103',
          stationName: 'V-103'
        }
      },
      {
        id: 3,
        data: {
          feeds: {
            'News/Talk': true
          },
          market: 'Atlanta, GA',
          callsign: 'WAOKAM',
          siteSlug: 'waok',
          stationName: 'News-Talk 1380 WAOK'
        }
      },
      {
        id: 4,
        data: {
          feeds: {
            Sports: true,
            Trending: true
          },
          market: 'Atlanta, GA',
          callsign: 'WZGCFM',
          siteSlug: '929thegame',
          stationName: '92-9 The Game'
        }
      },
      {
        id: 5,
        data: {
          feeds: {
            'Hot AC': true,
            Trending: true,
            'Hot AC / Top 40 / CHR': true
          },
          market: 'Austin-TX',
          callsign: 'KAMXFM',
          siteSlug: 'mix947',
          stationName: 'Mix 94.7'
        }
      }
    ]
  };

describe(`${dirname}/${filename}`, () => {
  describe('editorial feed syndication scenarios', () => {
    it('no feed assigned to content returns empty syndication', async () => {
      const { data, locals } = mockData;

      await addStationsByEditorialGroup(data, locals);
      expect(data.stationSyndication).to.be.empty;
    });
  
    it('editorial group assigned only to one station', async () => {
      const data = {
        ...mockData.data,
        editorialFeeds: {
          'News/Talk': true
        }
      };
  
      await addStationsByEditorialGroup(data, mockData.locals);
  
      expect(data.stationSyndication).to.have.lengthOf(1);
      expect(data.stationSyndication[0].stationName).to.eql('News-Talk 1380 WAOK');
    });

    it('editorial group assigned to several stations', async () => {
      const data = {
        ...mockData.data,
        editorialFeeds: {
          Trending: true
        }
      };
  
      await addStationsByEditorialGroup(data, mockData.locals);
  
      expect(data.stationSyndication).to.have.lengthOf(4);
    });

    it('content assigned to a falsy editorial feed', async () => {
      const data = {
        ...mockData.data,
        editorialFeeds: {
          Sports: true,
          'Hot AC': false
        }
      };
  
      await addStationsByEditorialGroup(data, mockData.locals);
  
      expect(data.stationSyndication).to.have.lengthOf(1);
      expect(data.stationSyndication[0].stationName).to.eql('92-9 The Game');
    });

    it('only one syndication entry created when stations are subscribed to several feeds', async () => {
      const data = {
        ...mockData.data,
        editorialFeeds: {
          Trending: true,
          'Hot AC / Top 40 / CHR': false
        }
      };
  
      await addStationsByEditorialGroup(data, mockData.locals);
  
      expect(data.stationSyndication).to.have.lengthOf(4);
      expect(data.stationSyndication[0].stationName).to.eql('Atlanta\'s Star 94.1');
      expect(data.stationSyndication[1].stationName).to.eql('V-103');
    });
  });
});
