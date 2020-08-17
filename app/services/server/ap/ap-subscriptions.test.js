'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,
  apSubscriptions = require('./ap-subscriptions');

chai.use(sinonChai);

describe('apSubscription', () => {
  afterEach(sinon.restore);

  const { _internals: __, save } = apSubscriptions;

  function setup_apSubscription(id = '') {
    const subscription = {};

    sinon.stub(__, 'dbPost').resolves('_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c');
    sinon.stub(__, 'dbPut').resolves('_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c');
    return { __, id, save, subscription };
  }

  it('creates a new record and return an id', async () => {
    const { __, save, subscription } = setup_apSubscription(),
      result = await save(null, subscription);

    expect(result).to.have.lengthOf(53);
    expect(__.dbPost).to.have.been.calledOnce;
    expect(__.dbPut).to.not.have.been.called;
  });

  it('updates an existing record and return the key updated', async () => {
    const { __, save, subscription, id } = setup_apSubscription('_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c'),
      result = await save(id, subscription);

    expect(result).to.have.length;
    expect(result).to.be.equal('_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c');
    expect(result).to.have.lengthOf(53);
    expect(__.dbPut).to.have.been.calledOnce;
    expect(__.dbPost).to.not.have.been.called;
  });

  describe('importApSubscription', () => {
    async function setup_importApSubscription(options = { returns: true, getAllCall: true, getApFeedCall: true, importArticleCall: true }) {
      const {  _internals: __, importApSubscription } = apSubscriptions,
        resultApFeed = [
          {
            item: {
              renditions: {
                main: {
                  href: 'https://api.testing/media/v/content/ceb68d0759c47'
                }
              },
              pubstatus: 'usable',
              altids: {
                etag: 'e0e14b78f5338c3a7674e49868a754b1_0a14aza0c0'
              },
              headline: 'This news does not real',
              uri: 'https://api.testing/media/v/content/589692882c67650b87daeec5765660c5?qt=ZfXRTOa25F&et=0a1aza0c0'
            },
            products: [
              {
                id: 12345,
                name: 'AP Top News'
              }
            ]
          }
        ],
        resultGetAll = [
          {
            id: '_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c',
            data: {
              mappings: [
                {
                  sectionFront: 'news',
                  secondarySectionFront: 'rock And roll all night'
                }
              ],
              station: { label: 'Station 1', value: 'slug1' },
              entitlements: [
                {
                  name: 'AP Top News - Entertainment - Stories',
                  value: 12345
                }
              ]
            }
          },
          {
            id: '_ap_subscriptionsb39ad124-b073-4e92-8a82-c7d482aa74df',
            data: {
              mappings: [
                {
                  sectionFront: 'sports',
                  secondarySectionFront: 'footbal'
                }
              ],
              station: { label: 'Station 2', value: 'slug2' },
              entitlements: [
                {
                  name: 'An entitlement from the list in ON-1979',
                  value: 6789
                }
              ]
            }
          }
        ],
        locals = { site: { host: 'some.radio.com' } },
        getApFeedStub = sinon.stub(),
        getAllStub = sinon.stub(),
        importArticleStub = sinon.stub(),
        logStub = sinon.stub();

      if (options.getAllCall) {
        getAllStub.resolves(resultGetAll);
      } else {
        getAllStub.rejects();
      }

      if (options.getApFeedCall) {
        getApFeedStub.resolves(options.returns ? resultApFeed : []);
      } else {
        getApFeedStub.rejects();
      }

      if (options.importArticleCall) {
        importArticleStub.resolves({ article: {} });
      } else {
        importArticleStub.rejects();
      }

      __.log = logStub;
      __.getAll = getAllStub;
      __.getApFeed = getApFeedStub;
      __.importArticle = importArticleStub;

      const response = await importApSubscription(locals);

      return {
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub,
        response
      };
    }

    it('imports ap-subscription articles', async () => {
      const {
        getAllStub,
        getApFeedStub,
        importArticleStub,
        response
      } = await setup_importApSubscription();

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(1);
      expect(response[0]).to.have.include('&include=*');
    });

    it('importing an ap-subscription no ap-feed', async () => {
      const {
        getAllStub,
        getApFeedStub,
        importArticleStub,
        response
      } = await setup_importApSubscription({ returns: false, getAllCall: true, getApFeedCall: true, importArticleCall: true });

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(response).that.eql([]);
    });

    it('importing an ap-subscription fail getAll', async () => {
      const {
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub,
        response
      } = await setup_importApSubscription({ returns: true, getAllCall: false, getApFeedCall: true, importArticleCall: true });

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(logStub).to.have.been.calledOnceWith('error', 'Bad request importing articles from ap-subscription');
      expect(response).that.eql([]);
    });

    it('importing an ap-subscription fail getApFeed', async () => {
      const {
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub,
        response
      } = await setup_importApSubscription({ returns: true, getAllCall: true, getApFeedCall: false, importArticleCall: true });

      expect(getApFeedStub).to.have.been.callCount(1);
      expect(getAllStub).to.have.been.callCount(0);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(logStub).to.have.been.calledOnceWith('error', 'Bad request importing articles from ap-subscription');
      expect(response).that.eql([]);
    });
  });
});

