'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  uri = 'clay.radio.com/_components/article/instances/cjzbandlv000f3klg5krzbyyx',
  proxyquire = require('proxyquire'),
  { save } = proxyquire('./create-content', {
    './rest': {
      get: (uri) => {
        const isPublishedRequest = /@published/.test(uri);

        return isPublishedRequest
          // published mock
          ? Promise.resolve(null)
          // unpublished mock
          : Promise.resolve({
            ...mockData,
            slug: '',
            seoHeadline: ''
          });
      }
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
      byline: [ { prefix: 'by', names: [], sources: [] } ],
      syndicatedUrl: '',
      corporateSyndication: [],
      stationSyndication: [],
      genreSyndication: [],
      syndicationStatus: 'original',
      lead: [],
      content:
      [ { _ref: 'clay.radio.com/_components/paragraph/instances/new' } ],
      tags: { _ref: 'clay.radio.com/_components/tags/instances/new' },
      adTags: { _ref: 'clay.radio.com/_components/ad-tags/instances/new' },
      contentPageSponsorLogo:
      { _ref: 'clay.radio.com/_components/google-ad-manager/instances/contentPageLogoSponsorship' },
      sideShare: { _ref: 'clay.radio.com/_components/share/instances/new' },
      feeds:
      { sitemaps: true,
        rss: true,
        'most-popular': true,
        newsfeed: true,
        'apple-news': true },
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
    }
  };

describe(`${dirname}/${filename}`, () => {
  const seoHeadline = 'bar';

  it('syncs slug to seo headline', async () => {
    const data = {
      ...mockData,
      slug: '',
      seoHeadline
    };

    await save(uri, data, mockData.locals);
    expect(data.slug).to.equal(seoHeadline);
  });

  it('sets custom slug', async () => {
    const customSlug = 'custom-slug',
      data = {
        ...mockData,
        slug: customSlug,
        seoHeadline
      };

    await save(uri, data, mockData.locals);
    expect(data.slug).to.equal(customSlug);
  });
});
