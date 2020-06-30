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
          searchByQueryStub = sinon.stub(__, 'searchByQuery')
            .resolves([])
            .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
            .resolves([{ _id: EXISTING_ARTICLE_ID }]),

          result = await importArticle(apMeta);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING_ARTICLE_ID,
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

    });
  });
})
;
