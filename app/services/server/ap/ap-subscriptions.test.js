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
              headline: 'This news does not real'
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
              stationSlug: 'slug1',
              entitlements: [
                {
                  id: 12345,
                  name: 'AP Top News - Entertainment - Stories'
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
              stationSlug: 'slug2',
              entitlements: [
                {
                  id: 6789,
                  name: 'An entitlement from the list in ON-1979'
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
        logStub,
        response,
        importArticleStub,
        getApFeedStub
      };
    }

    it('importing ap-subscription articles', async () => {
      const {
        response,
        getAllStub,
        importArticleStub,
        getApFeedStub
      } = await setup_importApSubscription();

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(1);
      expect(response[0]).to.have.property('article');
    });

    it('importing an ap-subscription no ap-feed', async () => {
      const {
        response,
        getAllStub,
        importArticleStub,
        getApFeedStub
      } = await setup_importApSubscription({ returns: false, getAllCall: true, getApFeedCall: true, importArticleCall: true });

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(response).that.eql([]);
    });

    it('importing an ap-subscription fail getAll', async () => {
      const {
        response,
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub
      } = await setup_importApSubscription({ returns: true, getAllCall: false, getApFeedCall: true, importArticleCall: true });

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(response).that.eql([]);
      expect(logStub).to.have.been.calledOnceWith('error', 'Bad request importing articles from ap-subscription');
    });

    it('importing an ap-subscription fail getApFeed', async () => {
      const {
        response,
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub
      } = await setup_importApSubscription({ returns: true, getAllCall: true, getApFeedCall: false, importArticleCall: true });

      expect(getApFeedStub).to.have.been.callCount(1);
      expect(getAllStub).to.have.been.callCount(0);
      expect(importArticleStub).to.have.been.callCount(0);
      expect(response).that.eql([]);
      expect(logStub).to.have.been.calledOnceWith('error', 'Bad request importing articles from ap-subscription');
    });

    it('importing an ap-subscription fail importArticle', async () => {
      const {
        response,
        getAllStub,
        getApFeedStub,
        importArticleStub,
        logStub
      } = await setup_importApSubscription({ returns: true, getAllCall: true, getApFeedCall: true, importArticleCall: false });

      expect(getAllStub).to.have.been.callCount(1);
      expect(getApFeedStub).to.have.been.callCount(1);
      expect(importArticleStub).to.have.been.callCount(1);
      expect(response).that.eql([]);
      expect(logStub).to.have.been.calledOnceWith('error', 'Bad request importing articles from ap-subscription');
    });
  });
});

