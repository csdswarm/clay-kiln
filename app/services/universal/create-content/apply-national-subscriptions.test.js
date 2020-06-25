'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  proxyquire = require('proxyquire'),
  { applyNationalSubscriptions } = proxyquire('./apply-national-subscriptions', {
    '../../server/get-stations-subscribed-to-content': () => Promise.resolve(mockData.stationsSubscribedToContent)
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
      stationSlug: 'alt1037dfw',
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
    stationsSubscribedToContent: [
      {
        callsign: 'WXRTFM',
        name: '93XRT',
        site_slug: 'wxrt'
      },
      {
        callsign: 'WNCXFM',
        name: '98.5 WNCX',
        site_slug: 'wncx'
      },
      {
        callsign: 'KQMTFM',
        name: '99.5 The Mountain',
        site_slug: '995themountain'
      },
      {
        callsign: 'WROQFM',
        name: 'Classic Rock 101.1',
        site_slug: 'classicrock1011'
      },
      {
        callsign: 'WKBUFM',
        name: 'Bayou 95.7',
        site_slug: 'bayou957'
      }
    ]
  };

describe(`${dirname}/${filename}`, () => {
  describe('apply national subscriptions scenarios', () => {
    it('add subscribed stations to stationSyndication list', async () => {
      const { data, locals } = mockData;

      await applyNationalSubscriptions(data, locals);
      expect(data.stationSyndication).to.have.lengthOf(5);
    });

    it('previous syndications from national subscriptions should be removed', async () => {
      const data = {
        ...mockData.data,
        stationSyndication: [
          {
            source: 'national subscription',
            callsign: 'WROQFM',
            stationName: 'Classic Rock 101.1',
            stationSlug: 'classicrock1011',
            syndicatedArticleSlug: '/classicrock1011/the-greatest-band-of-all-times'
          }
        ]
      };

      await applyNationalSubscriptions(data, mockData.locals);

      expect(data.stationSyndication).to.have.lengthOf(5);
      expect(data.stationSyndication[0].stationName).to.eql('93XRT');
    });

    it('syndication data should include primary and secondary section fronts, if present', async () => {
      const data = {
        ...mockData.data,
        sectionFront: 'music',
        secondarySectionFront: 'rock'
      };

      await applyNationalSubscriptions(data, mockData.locals);

      expect(data.stationSyndication).to.have.lengthOf(5);
      expect(data.stationSyndication[0].sectionFront).to.eql('music');
      expect(data.stationSyndication[0].secondarySectionFront).to.eql('rock');
    });
  });
});
