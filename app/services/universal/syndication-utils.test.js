'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  syndicationUtils = require('./syndication-utils'),

  { expect } = chai;

chai.use(sinonChai);

describe('universal', () => {
  afterEach(sinon.restore);

  describe('syndication-utils', () => {
    function setup_syndicationUtils(options = {}) {
      const
        {
          localStationSlug = 'local-station',
          itemStationSlug = 'item-station',
          syndicatedItemStationSlug = 'other-station',
          itemSyndication = [{
            stationSlug: syndicatedItemStationSlug,
            syndicatedArticleSlug: `/${syndicatedItemStationSlug}/main/secondary/some-article`
          }]
        } = options,
        { _internals: __, generateSyndicationSlug, syndicationUrlPremap } = syndicationUtils,
        testItem = {
          stationSlug: itemStationSlug,
          canonicalUrl: `https://domain.com/${itemStationSlug}/my-primary-front/some-article`,
          stationSyndication: itemSyndication
        };

      // sinon.spy(__) not working with sinon.restore() for some reason, so use sinon(__, propName) which does.
      Object.keys(__).forEach(prop => sinon.spy(__, prop));

      return { __, generateSyndicationSlug, syndicationUrlPremap, localStationSlug, testItem };
    }

    describe('generateSyndicationSlug', () => {
      const setup_generateSyndicationSlug = (options = {}) => setup_syndicationUtils(options);

      it('generates a syndication URL', () => {
        const { generateSyndicationSlug } = setup_generateSyndicationSlug(),
          args = ['some-slug', { stationSlug: 'abc-radio', sectionFront: 'music', secondarySectionFront: 'two' }];

        expect(generateSyndicationSlug(...args)).to.eql('/abc-radio/music/two/some-slug');
      });

      it('prevents double slashes when some args are missing or empty', () => {
        const { generateSyndicationSlug } = setup_generateSyndicationSlug(),
          slug = 'some-slug', stationSlug = 'radio-bob', sectionFront = 'music';

        expect(generateSyndicationSlug(slug, { stationSlug, sectionFront })).to.eql('/radio-bob/music/some-slug');
        expect(generateSyndicationSlug(slug, { stationSlug })).to.eql('/radio-bob/some-slug');
        expect(generateSyndicationSlug(slug, { stationSlug: '', sectionFront })).to.eql('/music/some-slug');

      });

    });

    describe('syndicationUrlPremap', () => {
      const setup_syndicationUrlPremap = (options = {}) => setup_syndicationUtils(options);

      it('generates a mapping function that checks against the main station', () => {
        const { __, syndicationUrlPremap, localStationSlug } = setup_syndicationUrlPremap(),
          result = syndicationUrlPremap(localStationSlug);

        expect(typeof result).to.equal('function');
        expect(__.inStation).to.have.been.calledWith(localStationSlug);
        expect(__.findSyndicatedStation).to.have.been.calledWith(localStationSlug);
      });

      describe('syndicationUrlPremap_mapper', ()=> {
        function setup_syndicationUrlPremap_mapper(options = {}) {
          const assets = setup_syndicationUrlPremap(options),
            mapper = assets.syndicationUrlPremap(assets.localStationSlug);

          return { ...assets, mapper };
        }

        it('makes no changes if the article is in the same station', () => {
          const { mapper, testItem } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a',
              itemStationSlug: 'station-a'
            }),
            result = mapper(testItem);

          expect(result).to.eql(testItem);
        });

        it('throws if article is in different station, and has no stationSyndication', () => {
          const { mapper, testItem } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a',
              itemStationSlug: 'station-b',
              itemSyndication: null
            }),
            result = () => mapper(testItem);

          expect(result).to.throw('Article is not in target station, and has no stationSyndication');
        });

        it('throws if article is in different station, and has no stationSyndication items', () => {
          const { mapper, testItem } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a',
              itemStationSlug: 'station-b',
              itemSyndication: []
            }),
            result = () => mapper(testItem);

          expect(result).to.throw('Article is not in target station, and has no stationSyndication');
        });

        it('updates the canonicalUrl for syndicated stations to the current station', ()=>{
          const { mapper } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a',
              itemStationSlug: 'station-b',
              syndicatedItemStationSlug: 'station-a'
            }),
            testItem = {
              stationSlug: 'station-b',
              canonicalUrl: 'https://domain.com/station-b/my-primary-front/amazing-stuff',
              stationSyndication: [
                {
                  stationSlug: 'station-a',
                  syndicatedArticleSlug: '/station-a/music/stuff/amazing-stuff'
                }
              ]
            },
            result = mapper(testItem);

          expect(result.canonicalUrl).to.equal('https://domain.com/station-a/music/stuff/amazing-stuff');
        });
      });
    });
  });
});
