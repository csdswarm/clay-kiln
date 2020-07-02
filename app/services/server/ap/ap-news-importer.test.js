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
          DEFAULT_ARTICLE_DATA = {
            slug: '',
            sectionFront: '',
            secondarySectionFront: '',
            stationSyndication: []
          },
          NEW_PAGE_DATA = {
            main: [{ ...DEFAULT_ARTICLE_DATA }]
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
          HOST = 'some.radio.com',
          LOCALS = { site: { host: HOST } },
          ELASTIC_AP_ID_PATH = 'body.query.term[\'ap.itemid\']',
          EXISTING_ARTICLE_ID = `${HOST}/_components/article/instances/ck64dqppgzzzzabcd01234567@published`,
          apMeta = { ...DEFAULT_AP_META, ...options.apMeta },
          locals = { ...LOCALS, ...options.locals },
          stationMappings = options.stationMappings || {},
          createPageStub = sinon.stub(),
          dbGetStub = sinon.stub(),
          bySlugStub = sinon.stub(),
          logStub = sinon.stub(),
          searchByQueryStub = sinon.stub();

        createPageStub.resolves({ ...NEW_PAGE_DATA, stationSlug: Object.keys(stationMappings)[0] });

        dbGetStub.resolves({});
        dbGetStub
          .withArgs('_pages/new-two-col')
          .resolves(NEW_PAGE_DATA);

        bySlugStub.resolves(options.stationsBySlug || {});

        searchByQueryStub.resolves([]);
        searchByQueryStub
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
          .resolves([{ _id: EXISTING_ARTICLE_ID, ...DEFAULT_ARTICLE_DATA, ap: { itemid: 'some-existing-id' } }]);
        searchByQueryStub
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'abcdefg'))
          .resolves([{ _id: EXISTING_ARTICLE_ID, ...DEFAULT_ARTICLE_DATA, ap: { itemid: 'abcdefg', etag: 'abcdefg_4321' } }]);
        searchByQueryStub
          .withArgs(sinon.match(value => !value.body.query.term['ap.itemid']))
          .rejects('Error');

        __.createPage = createPageStub;
        __.dbGet = dbGetStub;
        __.getAllStations = { bySlug: bySlugStub };
        __.log = logStub;
        __.searchByQuery = searchByQueryStub;

        const result = await importArticle(apMeta, stationMappings, locals);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING_ARTICLE_ID,
          createPageStub,
          dbGetStub,
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
            ELASTIC_AP_ID_PATH,
            EXISTING_ARTICLE_ID,
            result,
            searchByQueryStub
          } = await setup_importArticle({ apMeta: { altids: { itemid } } });

        expect(result).to.have.property('preExistingArticle');
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested('index', 'published-content'));
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested(ELASTIC_AP_ID_PATH, itemid));
        expect(result.preExistingArticle._id).to.eql(EXISTING_ARTICLE_ID);
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
        expect(dbGetStub).to.have.been.calledOnceWith('_pages/new-two-col');
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

      it('gets any new stations to map to', async () => {
        const { result } = await setup_importArticle({
          stationsBySlug: {
            stationA: {
              callsign: 'STA',
              name: 'Station A'
            }
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
    });
  });
})
;
