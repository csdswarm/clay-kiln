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

      describe('syndicationUrlPremap_mapper', () => {
        function setup_syndicationUrlPremap_mapper(options = {}) {
          const assets = setup_syndicationUrlPremap(options),
            mapper = assets.syndicationUrlPremap(assets.localStationSlug),
            inStation = assets.__.inStation(assets.localStationSlug);

          return { ...assets, mapper, inStation };
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

        it('updates the canonicalUrl for syndicated stations to the current station', () => {
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

        it('canonical url is not replaced when item and local station slugs are empty', () => {
          const { mapper } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              stationSlug: '',
              canonicalUrl: 'https://domain.com/my-primary-front/amazing-stuff',
              stationSyndication: [
                {
                  stationSlug: 'station-a',
                  syndicatedArticleSlug: '/station-a/music/stuff/amazing-stuff'
                }
              ]
            },
            result = mapper(testItem);

          expect(result.canonicalUrl).to.equal('https://domain.com/my-primary-front/amazing-stuff');
        });

        it('canonical url for an item syndicated to an empty station slug is generated correctly', () => {
          const { mapper } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              stationSlug: 'station-a',
              canonicalUrl: 'https://domain.com/station-a/music/stuff/amazing-stuff',
              stationSyndication: [
                {
                  stationSlug: '',
                  syndicatedArticleSlug: '/my-primary-front/amazing-stuff'
                }
              ]
            },
            result = mapper(testItem);

          expect(result.canonicalUrl).to.equal('https://domain.com/my-primary-front/amazing-stuff');
        });

        it('canonical url is not replaced when item station slug is not set', () => {
          const { mapper } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              canonicalUrl: 'https://domain.com/my-primary-front/amazing-stuff',
              stationSyndication: [
                {
                  stationSlug: 'station-a',
                  syndicatedArticleSlug: '/station-a/music/stuff/amazing-stuff'
                }
              ]
            },
            result = mapper(testItem);

          expect(result.canonicalUrl).to.equal('https://domain.com/my-primary-front/amazing-stuff');
        });

        it('generates a function that checks if an item belongs to a station', () => {
          const { __, localStationSlug } = setup_syndicationUrlPremap_mapper(),
            result = __.inStation(localStationSlug);

          expect(typeof result).to.equal('function');
          expect(__.inStation).to.have.been.calledWith(localStationSlug);
        });

        it('checks if article is in the same station', () => {
          const { inStation, testItem } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a',
              itemStationSlug: 'station-a'
            }),
            result = inStation(testItem);

          expect(result).to.eql(true);
        });

        it('checks if article is syndicated to locals station', () => {
          const { inStation } = setup_syndicationUrlPremap_mapper({
              localStationSlug: 'station-a'
            }),
            testItem = {
              source: 'manual syndication',
              stationSlug: 'station-a',
              syndicatedArticleSlug: '/station-a/music/stuff/amazing-stuff'
            },
            result = inStation(testItem);

          expect(result).to.eql(true);
        });

        it('checks if article belongs to station with empty slug', () => {
          const { inStation, testItem } = setup_syndicationUrlPremap_mapper({
              localStationSlug: '',
              itemStationSlug: ''
            }),
            result = inStation(testItem);

          expect(result).to.eql(true);
        });

        it('checks if article is syndicated to station with empty slug', () => {
          const { inStation } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              source: 'manual syndication',
              stationSlug: '',
              syndicatedArticleSlug: '/my-primary-front/amazing-stuf'
            },
            result = inStation(testItem);

          expect(result).to.eql(true);
        });

        it('content without station slug defaults to empty slug', () => {
          const { inStation } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              canonicalUrl: 'https://domain.com/station-a/music/stuff/amazing-stuff'
            },
            result = inStation(testItem);

          expect(result).to.eql(true);
        });

        it('syndication entry without station slug does not default to empty slug', () => {
          const { inStation } = setup_syndicationUrlPremap_mapper({
              localStationSlug: ''
            }),
            testItem = {
              source: 'manual syndication',
              syndicatedArticleSlug: '/my-primary-front/amazing-stuf'
            },
            result = inStation(testItem);

          expect(result).to.eql(false);
        });
      });
    });

    describe('filterUnsubscribedEntries', () => {
      const subscriptions =  [
          {
            stationSlug: 'station-a',
            callsign: 'callsign-a',
            syndicatedArticleSlug: '/my-primary-front/amazing-stuff',
            source: 'content subscription'
          },
          {
            stationSlug: 'station-b',
            callsign: 'callsign-b',
            syndicatedArticleSlug: '/my-primary-front/amazing-stuff',
            source: 'editorial feed'
          },
          {
            stationSlug: 'station-b',
            callsign: 'callsign-b',
            syndicatedArticleSlug: '/my-primary-front/amazing-stuff',
            source: 'manual syndication'
          }
        ],
        unsubscribed = [
          {
            stationSlug: 'station-b',
            callsign: 'callsign-b',
            syndicatedArticleSlug: '/my-primary-front/amazing-stuff',
            source: 'editorial feed'
          }
        ];

      it('should filter elements that match callsign from the subscription array', () => {
        expect(syndicationUtils.filterUnsubscribedEntries(unsubscribed, subscriptions)).to.have.length(1);
      });
    });
  });
});
