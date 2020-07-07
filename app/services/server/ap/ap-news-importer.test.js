'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  apNewsImporter = require('./ap-news-importer'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('ap-news-importer', () => {
    function setup_apNewsImporter() {
      const { _internals: __, importArticle } = apNewsImporter;

      return { __, importArticle };
    }

    describe('importArticle', () => {
      async function setup_importArticle(options = {}) {
        const setup = setup_apNewsImporter(),
          { __, importArticle } = setup,
          HOST = 'some.radio.com',
          DEFAULT_ARTICLE_DATA = {
            slug: '',
            sectionFront: '',
            secondarySectionFront: '',
            stationSyndication: [],
            ...options.article
          },
          DEFAULT_AP_META = {
            signals: ['newscontent'],
            pubstatus: 'usable',
            editorialtypes: ['Lead'],
            altids: {
              itemid: 'abcdefg',
              etag: 'abcdefg_1234'
            }
          },
          EXISTING = buildApData('exists', HOST, DEFAULT_ARTICLE_DATA),
          NEW = buildApData('new', HOST, DEFAULT_ARTICLE_DATA),
          LOCALS = { site: { host: HOST } },
          ELASTIC_AP_ID_PATH = 'body.query.term[\'ap.itemid\']',
          apMeta = { ...DEFAULT_AP_META, ...options.apMeta },
          locals = { ...LOCALS, ...options.locals },
          stationMappings = options.stationMappings || {},
          stubs = [
            'bySlug',
            'createPage',
            'dbGet',
            'dbRaw',
            'log',
            'searchByQuery'
          ].reduce((acc, name) => ({ ...acc, [name]: sinon.stub() }), {});

        stubs.createPage.resolves({ ...NEW.PAGE_DATA, stationSlug: Object.keys(stationMappings)[0] });

        stubs.dbGet.resolves({});
        stubs.dbGet
          .withArgs('_pages/new-two-col')
          .resolves(NEW.PAGE_DATA);
        stubs.dbGet
          .withArgs(NEW.ARTICLE.ID)
          .resolves(NEW.PAGE_ARTICLE);
        stubs.dbGet
          .withArgs(EXISTING.ARTICLE.ID)
          .resolves(EXISTING.PAGE_ARTICLE);

        stubs.dbRaw
          .withArgs(sinon.match('jsonb_array_elements_text(data->\'main\')'), EXISTING.ARTICLE.ID)
          .resolves({ rows: [ EXISTING.PAGE_DATA ] });

        stubs.bySlug.resolves(options.stationsBySlug || {});

        stubs.searchByQuery.resolves([]);
        stubs.searchByQuery
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
          .resolves([{ _id: EXISTING.ARTICLE.ID, ...DEFAULT_ARTICLE_DATA, ap: { itemid: 'some-existing-id' } }]);
        stubs.searchByQuery
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'abcdefg'))
          .resolves([{
            _id: EXISTING.ARTICLE.ID, ...DEFAULT_ARTICLE_DATA,
            ap: { itemid: 'abcdefg', etag: 'abcdefg_4321' }
          }]);
        stubs.searchByQuery
          .withArgs(sinon.match(value => !value.body.query.term['ap.itemid']))
          .rejects('Error');

        Object.entries(stubs)
          .filter(([name]) => name !== 'bySlug')
          .forEach(([key, value]) => __[key] = value);

        __.getAllStations.bySlug = stubs.bySlug;

        const result = await importArticle(apMeta, stationMappings, locals);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING,
          NEW,
          locals,
          result,
          stubs,
          stationMappings
        };
      }

      it('marks content as unpublishable if it is not newscontent', async () => {
        const { result } = await setup_importArticle({ apMeta: { signals: [] } });

        expect(result)
          .to.have.property('isApContentPublishable')
          .that.eqls(false);
      });

      it('marks content as unpublishable if its pubstatus is not usable', async () => {
        const { result } = await setup_importArticle({ apMeta: { pubstatus: '' } });

        expect(result.isApContentPublishable)
          .to.eql(false);
      });

      it('marks content as unpublishable if its editorialtypes contains the word Kill', async () => {
        const { result } = await setup_importArticle({ apMeta: { editorialtypes: ['Kill'] } });

        expect(result.isApContentPublishable)
          .to.eql(false);
      });

      it('finds the existing article if this has been imported already', async () => {
        const
          itemid = 'some-existing-id',
          {
            ELASTIC_AP_ID_PATH,
            EXISTING,
            result,
            stubs
          } = await setup_importArticle({ apMeta: { altids: { itemid } } });

        expect(result).to.have.property('preExistingArticle');
        expect(stubs.searchByQuery).to.have.been.calledOnceWith(sinon.match.hasNested('index', 'published-content'));
        expect(stubs.searchByQuery).to.have.been.calledOnceWith(sinon.match.hasNested(ELASTIC_AP_ID_PATH, itemid));
        expect(stubs.dbRaw).to.have.been.calledOnceWith(sinon.match('article_id = ?'), EXISTING.ARTICLE.ID);
        expect(result).to.deep.include({
          preExistingArticle: {
            ...EXISTING.PAGE_DATA
          }
        });
      });

      it('creates a new article if one does not already exist', async () => {
        const {
            locals,
            result,
            stationMappings,
            stubs
          } = await setup_importArticle({
            stationsBySlug: {
              'test-station': {},
              'second-station': {}
            },
            stationMappings: {
              'test-station': {},
              'second-station': {}
            },
            apMeta: {
              altids: { itemid: 'not-in-unity-yet', etag: 'not-in-unity-yet_1234' }
            }
          }),
          [stationSlug] = Object.keys(stationMappings);

        expect(result.preExistingArticle).to.be.undefined;
        expect(result).to.have.property('article');
        expect(stubs.createPage).to.have.been.calledOnceWith(sinon.match.object, stationSlug, locals);
        expect(stubs.dbGet).to.have.been.calledWith('_pages/new-two-col');
      });

      it('traps errors when checking for existing elastic content', async () => {
        const
          noItemId = sinon.match(value => value.body.query.term['ap.itemid'] === undefined),
          { result, stubs } = await setup_importArticle({ apMeta: { altids: { undefined } } });

        expect(stubs.searchByQuery).to.have.been.calledWith(noItemId);
        expect(stubs.log).to.have.been.calledOnceWith('error', 'Problem getting existing data from elastic');
        expect(result.preExistingArticle).to.be.undefined;
      });

      it('checks to see if anything has been modified by AP', async () => {
        const { result } = await setup_importArticle();

        expect(result).to.have.property('isModifiedByAP');
        expect(result.isModifiedByAP).to.eql(true);
      });

      describe('modified by AP', () => {
        async function setup_modifiedByAP(options = {}) {
          const
            setup = await setup_importArticle({
              apMeta: {
                altids: {
                  itemid: 'xyz123',
                  etag: 'xyz123_mod1'
                },
                version: 1,
                ednote: 'go ahead and publish, there are no problems here.',
                headline: 'Something tragic happened',
                headline_extended: 'Something tragic happened on the way to heaven',
                subject: [
                  { name: 'Heaven', creator: 'Machine' },
                  { name: 'Earth', creator: 'Machine' },
                  { name: 'Tragedy', creator: 'Machine' }
                ],
                associations: {
                  1: {
                    uri: 'https://api.ap.org/media/v/content/0726a2a7a06b48d0af1e41bf04fe8f80',
                    altids: { itemid: '0726a2a7a06b48d0af1e41bf04fe8f80' },
                    type: 'picture',
                    headline: 'Something tragic'
                  }
                },
                renditions: {
                  nitf: {
                    href: 'https://api.ap.org/media/v/content/c116ac3656f240238ee7529720e4a4b8/download?type=text&format=NITF'
                  }
                },
                ...options.apMeta
              }
            }),
            { __, stubs } = setup;
            
          stubs.dbPut = sinon.stub();

          __.dbPut = stubs.dbPut;

          return { ...setup };
        }

        it('maps AP data to article if content is publishable', async () => {
          const { result } = await setup_modifiedByAP(),
            { article } = result,
            expectedTitle = 'Something tragic happened',
            expected = {
              ap:
                {
                  itemid: 'xyz123',
                  etag: 'xyz123_mod1',
                  version: 1,
                  ednote: 'go ahead and publish, there are no problems here.'
                },
              headline: expectedTitle,
              shortHeadline: expectedTitle,
              msnTitle: expectedTitle,
              pageTitle: expectedTitle,
              slug: 'something-tragic-happened',
              seoDescription: 'Something tragic happened on the way to heaven',
              pageDescription: 'Something tragic happened on the way to heaven'
            },
            expectedTags = {
              items: [
                { text: 'AP News', slug: 'ap-news' },
                { text: 'Heaven', slug: 'heaven' },
                { text: 'Earth', slug: 'earth' },
                { text: 'Tragedy', slug: 'tragedy' }
              ]
            };

          expect(article).to.deep.include({
            ...expected,
            tags: { ...expectedTags }
          });
        });
        
        it('maps AP data to meta title when publishable', async () => {
          const
            expectedTitle = 'You can go your own way!',
            { result } = await setup_modifiedByAP({ apMeta: { headline: expectedTitle } }),
            { metaTitle } = result;

          expect(metaTitle).to.deep.include({
            kilnTitle: expectedTitle,
            ogTitle: expectedTitle,
            title: expectedTitle,
            twitterTitle: expectedTitle
          });
        });

        it('maps AP data to meta description when publishable', async () => {
          const
            expected = 'You can go your own way, but it might be really, really far!',
            { result } = await setup_modifiedByAP({ apMeta: { headline_extended: expected } }),
            { metaDescription } = result;

          expect(metaDescription).to.deep.include({
            description: expected
          });
        });

        // TODO: test meta-image

        // TODO: test body mapping.
      });

      it('gets any new stations to map to', async () => {
        const { result } = await setup_importArticle({
          stationsBySlug: {
            stationA: { callsign: 'STA', name: 'Station A' }
          },
          apMeta: {
            altids: { itemid: 'not-in-unity-yet', etag: 'not-in-unity-yet_1234' }
          },
          stationMappings: {
            stationA: { sectionFront: 'music', secondarySectionFront: 'urban' }
          }
        });

        expect(result).to.have.property('newStations').that.eqls([{
          callsign: 'STA',
          sectionFront: 'music',
          secondarySectionFront: 'urban',
          stationName: 'Station A',
          stationSlug: 'stationA'
        }]);
      });

      it('only gets new stations if article already exists', async () => {
        const { result } = await setup_importArticle({
          stationsBySlug: {
            stationA: { callsign: 'STA', name: 'Station A' },
            stationB: { callsign: 'STB', name: 'Station B' },
            stationC: { callsign: 'STC', name: 'Station C' }
          },
          apMeta: {
            altids: { itemid: 'some-existing-id' }
          },
          stationMappings: {
            stationA: { sectionFront: 'music', secondarySectionFront: 'urban' },
            stationB: { sectionFront: 'news' },
            stationC: { sectionFront: 'music', secondarySectionFront: 'pop' }
          },
          article: {
            slug: 'some-news-slug',
            stationSlug: 'stationA',
            sectionFront: 'music',
            secondarySectionFront: 'urban',
            stationSyndication: [
              {
                callsign: 'STB',
                sectionFront: 'news',
                stationName: 'Station B',
                stationSlug: 'stationB',
                syndicatedArticleSlug: '/stationB/news/some-news-slug'
              }
            ]
          }
        });

        expect(result.newStations).to.eql([{
          callsign: 'STC',
          sectionFront: 'music',
          secondarySectionFront: 'pop',
          stationName: 'Station C',
          stationSlug: 'stationC'
        }]);

      });
    });
  });
});

function buildApData(idPostFix, host, data) {
  const
    INSTANCE_ID = idPostFix.toLowerCase().padStart(26, 'ck64dqppgzzzzabcd012345678'),
    ARTICLE = {
      ID: `${host}/_components/article/instances/${INSTANCE_ID}`
    },
    META = {
      TITLE: `${host}/_components/meta-title/instances/${INSTANCE_ID}`,
      DESCRIPTION: `${host}/_components/meta-description/instances/${INSTANCE_ID}`,
      IMAGE: `${host}/_components/meta-image/instances/${INSTANCE_ID}`,
      TAGS: `${host}/_components/meta-tags/instances/${INSTANCE_ID}`
    };
  
  return {
    ARTICLE,
    META,
    PAGE_DATA: {
      head: [...Object.values(META)],
      main: [ARTICLE.ID]
    },
    PAGE_ARTICLE: {
      ...data
    }
  };
}
