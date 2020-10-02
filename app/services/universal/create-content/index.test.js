'use strict';

const _noop = require('lodash/noop'),
  expect = require('chai').expect,
  uri = 'clay.radio.com/_components/article/instances/cjzbandlv000f3klg5krzbyyx',
  proxyquire = require('proxyquire'),
  { save } = proxyquire('./index', {
    '../url-exists': () => false,
    '../rest': {
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
    },
    './apply-content-subscriptions': _noop,
    '../editorial-feed-syndication': {
      addStationsByEditorialGroup: () => {
        mockData.data.stationSyndication = [];
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

describe('universal/create-content', () => {
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

  describe('byline operations', ()=>{
    it('adds all authors to the authors property', async () => {
      const data = {
        ...mockData.data, byline: [
          { names: [{ text: 'name1' }, { text: 'name2' }] },
          { names: [{ text: 'name4' }, { text: 'name5' }] }
        ]
      };

      await save(uri, data, mockData.locals);

      expect(data.authors, 'authors should be an array').to.be.an('array')
        .that.includes(data.byline[0].names[1], 'authors should include the second author');
      expect(data.authors[0], 'the first item in authors should be the first author in the first byline')
        .to.eql(data.byline[0].names[0]);
      expect(data.authors[3], 'the last item in authors should be the last author in the last byline')
        .to.eql(data.byline[1].names[1]);
    });

    it('adds all sources to the sources property', async () => {
      const data = {
        ...mockData.data, byline: [
          { names: [{ text: 'bob' }], sources: [{ text: 'source1' }, { text: 'source2' }] },
          { names: [{ text: 'tom' }], sources: [{ text: 'source3' }, { text: 'source4' }] }
        ]
      };

      await save(uri, data, mockData.locals);

      expect(data.sources, 'sources should be an array').to.be.an('array')
        .that.includes(data.byline[1].sources[1], 'sources should include the third source');
      expect(data.sources[0], 'the first item in sources should be the first source in the first byline')
        .to.eql(data.byline[0].sources[0]);
      expect(data.sources[3], 'the last item in sources should be the last source in the last byline')
        .to.eql(data.byline[1].sources[1]);
    });

    it('adds a slug to each author', async () => {
      const data = {
        ...mockData.data, byline: [
          { names: [{ text: 'Testy User' }, { text: 'María-Jose Carreño Quiñones' }] }
        ]
      };

      await save(uri, data, mockData.locals);

      expect(data.byline[0].names[0], 'author names should have slugs').to.have.property('slug');
      expect(data.byline[0].names[0].slug).to.equal('testy-user');
      expect(data.byline[0].names[1].slug).to.equal('mar%C3%ADa-jose-carre%C3%B1o-qui%C3%B1ones');
    });

    it('removes unnecessary `count` property from authors and sources', async () => {
      const data = {
        ...mockData.data, byline: [
          {
            names: [{ text: 'User 1', count: 10 }, { text: 'User 2', count: 1 }],
            sources: [{ text: 'Source 1', count: 3 }]
          }
        ]
      };

      await save(uri, data, mockData.locals);

      expect(data.byline[0].names[0]).not.to.have.property('count');
      expect(data.byline[0].names[1]).not.to.have.property('count');
      expect(data.byline[0].sources[0]).not.to.have.property('count');
    });
  });
});
