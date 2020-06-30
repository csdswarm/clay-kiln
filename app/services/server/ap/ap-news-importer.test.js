/* eslint-disable max-nested-callbacks */
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
          DEFAULT_AP_META =  {
            signals: ['newscontent'],
            pubstatus: 'usable',
            editorialtypes: ['Lead'],
            altids: {
              itemid: 'abdcefg',
              etag: 'abcdefg_1234'
            }
          },
          HOST = 'some.radio.com',
          ELASTIC_AP_ID_PATH = 'body.query.term[\'ap.itemid\']',
          EXISTING_ARTICLE_ID = `${HOST}/_components/article/instances/ck64dqppgzzzzabcd01234567@published`,
          apMeta = { ...DEFAULT_AP_META, ...options.apMeta },
          logStub = sinon.stub(),
          searchByQueryStub = sinon.stub();

        searchByQueryStub.resolves([]);
        searchByQueryStub
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
          .resolves([{ _id: EXISTING_ARTICLE_ID }]);
        searchByQueryStub
          .withArgs(sinon.match(value => !value.body.query.term['ap.itemid']))
          .rejects('Error');

        __.log = logStub;
        __.searchByQuery = searchByQueryStub;

        const result = await importArticle(apMeta);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING_ARTICLE_ID,
          logStub,
          result,
          searchByQueryStub
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

        expect(result).to.have.property('existingArticle');
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested('index', 'published-content'));
        expect(searchByQueryStub).to.have.been.calledOnceWith(sinon.match.hasNested(ELASTIC_AP_ID_PATH, itemid));
        expect(result.existingArticle._id).to.eql(EXISTING_ARTICLE_ID);
      });

      it('traps errors when checking for elastic content', async () => {
        const
          noItemId = sinon.match(value => value.body.query.term['ap.itemid'] === undefined ),
          { logStub, result, searchByQueryStub } = await setup_importArticle({ apMeta: { altids: { undefined } } });

        expect(searchByQueryStub).to.have.been.calledWith(noItemId);
        expect(logStub).to.have.been.calledOnceWith('error', 'Problem getting existing data from elastic');
        expect(typeof result.existingArticle).to.eql('undefined');
      });

    });
  });
})
;
