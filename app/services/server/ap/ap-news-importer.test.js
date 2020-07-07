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
        // TODO: simplify this function by abstracting some things to different functions - ensure they are easy to find and read
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
          {
            EXISTING_ARTICLE_ID,
            EXISTING_PAGE_DATA,
            EXISTING_PAGE_ARTICLE
          } = buildApData('Existing', HOST, DEFAULT_ARTICLE_DATA),
          {
            NEW_ARTICLE_ID,
            NEW_PAGE_DATA,
            NEW_PAGE_ARTICLE
          } = buildApData('New', HOST, DEFAULT_ARTICLE_DATA),
          LOCALS = { site: { host: HOST } },
          ELASTIC_AP_ID_PATH = 'body.query.term[\'ap.itemid\']',
          apMeta = { ...DEFAULT_AP_META, ...options.apMeta },
          locals = { ...LOCALS, ...options.locals },
          stationMappings = options.stationMappings || {},
          createPageStub = sinon.stub(),
          dbGetStub = sinon.stub(),
          dbRawStub = sinon.stub(),
          bySlugStub = sinon.stub(),
          logStub = sinon.stub(),
          searchByQueryStub = sinon.stub();

        createPageStub.resolves({ ...NEW_PAGE_DATA, stationSlug: Object.keys(stationMappings)[0] });

        dbGetStub.resolves({});
        dbGetStub
          .withArgs('_pages/new-two-col')
          .resolves(NEW_PAGE_DATA);
        dbGetStub
          .withArgs(NEW_ARTICLE_ID)
          .resolves(NEW_PAGE_ARTICLE);
        dbGetStub
          .withArgs(EXISTING_ARTICLE_ID)
          .resolves(EXISTING_PAGE_ARTICLE);

        dbRawStub
          .withArgs(sinon.match('jsonb_array_elements_text(data->\'main\')'), EXISTING_ARTICLE_ID)
          .resolves({ rows: [ EXISTING_PAGE_DATA ] });

        bySlugStub.resolves(options.stationsBySlug || {});

        searchByQueryStub.resolves([]);
        searchByQueryStub
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
          .resolves([{ _id: EXISTING_ARTICLE_ID, ...DEFAULT_ARTICLE_DATA, ap: { itemid: 'some-existing-id' } }]);
        searchByQueryStub
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'abcdefg'))
          .resolves([{
            _id: EXISTING_ARTICLE_ID, ...DEFAULT_ARTICLE_DATA,
            ap: { itemid: 'abcdefg', etag: 'abcdefg_4321' }
          }]);
        searchByQueryStub
          .withArgs(sinon.match(value => !value.body.query.term['ap.itemid']))
          .rejects('Error');

        __.createPage = createPageStub;
        __.dbGet = dbGetStub;
        __.dbRaw = dbRawStub;
        __.getAllStations = { bySlug: bySlugStub };
        __.log = logStub;
        __.searchByQuery = searchByQueryStub;

        const result = await importArticle(apMeta, stationMappings, locals);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING_ARTICLE_ID,
          EXISTING_PAGE_DATA,
          createPageStub,
          dbGetStub,
          dbRawStub,
          locals,
          logStub,
          result,
          searchByQueryStub,
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
            dbRawStub,
            ELASTIC_AP_ID_PATH,
            EXISTING_ARTICLE_ID,
            EXISTING_PAGE_DATA,
            result,
            searchByQueryStub
          } = await setup_importArticle({ apMeta: { altids: { itemid } } });

        expect(result).to.have.property('preExistingArticle');
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested('index', 'published-content'));
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested(ELASTIC_AP_ID_PATH, itemid));
        expect(dbRawStub).to.have.been.calledOnceWith(sinon.match('article_id = ?'), EXISTING_ARTICLE_ID);
        expect(result).to.deep.include({
          preExistingArticle: {
            ...EXISTING_PAGE_DATA
          }
        });
      });

      it('creates a new article if one does not already exist', async () => {
        const {
            createPageStub,
            dbGetStub,
            result,
            locals,
            stationMappings
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
        expect(createPageStub).to.have.been.calledOnceWith(sinon.match.object, stationSlug, locals);
        expect(dbGetStub).to.have.been.calledWith('_pages/new-two-col');
      });

      it('traps errors when checking for existing elastic content', async () => {
        const
          noItemId = sinon.match(value => value.body.query.term['ap.itemid'] === undefined),
          { logStub, result, searchByQueryStub } = await setup_importArticle({ apMeta: { altids: { undefined } } });

        expect(searchByQueryStub).to.have.been.calledWith(noItemId);
        expect(logStub).to.have.been.calledOnceWith('error', 'Problem getting existing data from elastic');
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
                }
              },
              ...options.apMeta
            }),
            { __ } = setup,
            dbPutStub = sinon.stub();

          __.dbPut = dbPutStub;

          return { ...setup, dbPutStub };
        }

        it('maps AP data to article if content is publishable', async () => {
          const { result } = await setup_modifiedByAP(),
            { article } = result,
            expected = {
              ap:
                {
                  itemid: 'xyz123',
                  etag: 'xyz123_mod1',
                  version: 1,
                  ednote: 'go ahead and publish, there are no problems here.'
                },
              headline: 'Something tragic happened',
              shortHeadline: 'Something tragic happened',
              msnTitle: 'Something tragic happened',
              pageTitle: 'Something tragic happened',
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

          // TODO: test meta-title - title, ogTitle, twitterTitle, kilnTitle ?
          // TODO: test meta-description - description, defaultDescription ?
          // TODO: test meta-image

          // TODO: test body mapping.
        });
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

function buildApData(name, host, data) {
  const
    PRE = name.toUpperCase(),
    POST = name.toLowerCase(),
    INSTANCE_ID = POST.padStart(26, 'ck64dqppgzzzzabcd012345678'),
    ARTICLE_ID = `${host}/_components/article/instances/${INSTANCE_ID}`;
  
  return {
    [`${PRE}_ARTICLE_ID`]: `${host}/_components/article/instances/${INSTANCE_ID}`,
    [`${PRE}_PAGE_DATA`]: {
      head: [
        `${host}/_components/meta-title/instances/${INSTANCE_ID}`,
        `${host}/_components/meta-description/instances/${INSTANCE_ID}`,
        `${host}/_components/meta-image/instances/${INSTANCE_ID}`,
        `${host}/_components/meta-tags/instances/${INSTANCE_ID}`
      ],
      main: [ARTICLE_ID]
    },
    [`${PRE}_PAGE_ARTICLE`]: {
      ...data
    }
  };
}
