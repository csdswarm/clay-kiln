'use strict';

const _set = require('lodash/set'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,
  apSubscriptions = require('./ap-subscriptions');

chai.use(sinonChai);

describe('ap-subscriptions', () => {
  function setup_apSubscriptions() {
    const { _internals: __ } = apSubscriptions,
      sendStub = sinon.stub(),
      statusStub = sinon.stub().returns({ send: sendStub }),
      res = { status: statusStub },
      routes = {},
      routerFn = (method) => (name, fn) =>
        _set(routes, `${method}.${name}`, fn),
      router = {
        get: routerFn('get'),
        post: routerFn('post'),
        put: routerFn('put'),
        delete: routerFn('delete')
      };

    sinon.stub(__);
    apSubscriptions(router);

    return { __, apSubscriptions, res, routes, sendStub, statusStub };
  }

  afterEach(sinon.restore);

  describe('getApSubpscriptions', async () => {
    async function setup_get(options) {
      const { __, res, routes, sendStub, statusStub } = setup_apSubscriptions(),
        data = [
          [
            {
              id: '_ap_subscriptions3a328cc5-da2d-49a2-b323-a1403bb9518c',
              data: {
                mappings: [
                  {
                    sectionFront: 'news',
                    secondarySectionFront: 'rock And roll all night'
                  }
                ],
                stationSlug:
                  'This is **************@@@@@@@@@@##########****************',
                entitlements: [
                  {
                    id: 1235,
                    name: 'An entitlement from the list in ON-1979'
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
                stationSlug: 'sports-section',
                entitlements: [
                  {
                    id: 1235,
                    name: 'An entitlement from the list in ON-1979'
                  }
                ]
              }
            }
          ]
        ],
        req = {},
        getAllRecords = routes.get['/rdc/ap-subscriptions'];

      __.getAll.resolves(data);

      if (options && options.throws) {
        __.getAll.throws(new Error(options.throws));
      }
      await getAllRecords(req, res);
      return { __, data, getAllRecords, sendStub, statusStub };
    }
    it('Gets a list of records found in db', async () => {
      const { data, sendStub, statusStub } = await setup_get();

      expect(statusStub).to.be.calledOnceWith(200);
      expect(sendStub).to.be.calledOnce;
      expect(sendStub).to.be.calledOnceWith(data);
    });

    it('catches errors', async () => {
      const throws = 'no records in db',
        { sendStub, statusStub } = await setup_get({ throws });

      expect(statusStub).to.be.calledOnceWith(500);
      expect(sendStub).to.be.calledOnceWith({
        message: 'There was an error getting the subscriptions.'
      });
    });
  });

  describe('getApSubpscriptionRecord', async () => {
    async function setup_get_id(options) {
      const { __, res, routes, sendStub, statusStub } = setup_apSubscriptions(),
        req = {
          params: {
            id: options.id || 'some id'
          }
        },
        subscription = {
          mappings: [
            {
              sectionFront: 'news',
              secondarySectionFront: 'rock And roll all night'
            }
          ],
          stationSlug: 'This is **************@@@@@@@@@@##########****************',
          entitlements: [
            {
              id: 1235,
              name: 'An entitlement from the list in ON-1979'
            },
            {
              id: 1234,
              name: 'Anohter entitlement from the list in ON-1979'
            }
          ]
        },
        getApSubscription = routes.get['/rdc/ap-subscriptions/:id'];

      __.dbGet.resolves(subscription);

      if (options.throws) {
        __.dbGet.throws(new Error(options.throws));
      }
      await getApSubscription(req, res);
      return { __, sendStub, statusStub, subscription };
    }
    it('get existing subscription', async () => {
      const
        { sendStub, statusStub, subscription } = await setup_get_id({});

      expect(statusStub).to.be.calledOnceWith(200);
      expect(sendStub).to.be.calledOnce;
      expect(sendStub).to.be.calledWith(subscription);
    });

    it('Catches errors', async () => {
      const throws = 'some error',
        { __, sendStub, statusStub } = await setup_get_id({ throws });

      expect(statusStub).to.be.calledOnceWith(500);
      expect(sendStub).to.be.calledOnceWith({ message: 'There was an error getting current subscription.' });
      expect(__.log).to.have.been.calledOnce;
    });
  });

  describe('post', async () => {
    async function setup_post(options) {
      const { __, res, routes, sendStub, statusStub } = setup_apSubscriptions(),
        req = {
          body: {
            mappings: [
              {
                sectionFront: 'music',
                secondarySectionFront: 'rock And roll'
              }
            ],
            stationSlug: 'This is **************$$$$$$$$****************',
            entitlements: [
              {
                id: 1235,
                name: 'An entitlement from the list in ON-1979'
              }
            ]
          }
        },
        post = routes.post['/rdc/ap-subscriptions'],
        data = { id: options.id || 'some id', ...req.body };

      if (options.create) {
        __.save.resolves(data);
      }

      if (options.throws) {
        __.save.throws(new Error(options.throws));
      }

      await post(req, res);
      return { __, data, sendStub, statusStub };
    }
    it('Creates a new record and return newly created subscription', async () => {
      const create = 'a newly created id',
        { __, sendStub, statusStub } = await setup_post({ create });

      expect(statusStub).to.be.calledOnceWith(201);
      expect(__.save).to.be.calledOnce;
      expect(sendStub).to.have.been.calledOnce;
    });

    it('catches errors', async () => {
      const throws = 'some error',
        { __, sendStub, statusStub } = await setup_post({ throws });

      expect(statusStub).to.be.calledOnceWith(500);
      expect(sendStub).to.be.calledOnceWith({
        message: 'There was an error saving the supscription'
      });
      expect(__.log).to.be.calledOnceWith('error', throws);
    });
  });

  describe('put', async () => {
    async function setup_put(options) {
      const { __, res, routes, sendStub, statusStub } = setup_apSubscriptions(),
        req = {
          params: {
            id: options.id || 'some id'
          },
          body: {
            mappings: [
              {
                sectionFront: 'music',
                secondarySectionFront: 'rock And roll'
              }
            ],
            stationSlug: 'This is **************$$$$$$$$****************',
            entitlements: [
              {
                id: 1235,
                name: 'An entitlement from the list in ON-1979'
              }
            ]
          }
        },
        subscription = {
          id: options.id,
          data: { ...req.body }
        },
        put = routes.put['/rdc/ap-subscriptions/:id'];

      __.ensureRecordExists.resolves(true);
      __.ensureRecordExists.withArgs('does not exist').resolves(false);
      __.save.withArgs('some existing id').resolves(subscription);

      if (options.throws) {
        __.save.throws(new Error(options.throws));
      }
      await put(req, res);
      return { __, put, sendStub, statusStub, subscription };
    }

    it('Verifies the record to update exists', async () => {
      const notExist = 'does not exist',
        { sendStub, statusStub } = await setup_put({ id: notExist });

      expect(statusStub).to.be.calledOnceWith(400);
      expect(sendStub).to.be.calledWith({
        message: `No record was found for id ${notExist}`
      });
    });

    it('updates a subscription', async () => {
      const doesExist = 'some existing id',
        { sendStub, statusStub } = await setup_put({
          id: doesExist
        });

      expect(statusStub).to.be.calledOnceWith(200);
      expect(sendStub).to.have.property('id').to.be.string;
      expect(sendStub).to.be.calledOnce;
    });

    it('catches errors', async () => {
      const throws = 'some error',
        { __, sendStub, statusStub } = await setup_put({ throws });

      expect(statusStub).to.be.calledOnceWith(500);
      expect(sendStub).to.be.calledOnceWith({
        message: 'There was an error saving the supscription'
      });
      expect(__.log).to.be.calledOnceWith('error', throws);
    });
  });

  describe('delete', async () => {
    async function setup_delete(options) {
      const { __, res, routes, sendStub, statusStub } = setup_apSubscriptions(),
        req = {
          params: {
            id: options.id || 'some id'
          },
          body: {}
        },
        deletesubscription = routes.delete['/rdc/ap-subscriptions/:id'];

      __.ensureRecordExists.resolves(true);
      __.ensureRecordExists.withArgs('does not exist').resolves(false);
      if (options.id) {
        __.dbDel.withArgs('some existing id').resolves(options.id);
      }
      if (options.throws) {
        __.dbDel.throws(new Error(options.throws));
      }
      await deletesubscription(req, res);
      return { __, sendStub, statusStub };
    }
    it('Verifies the record to remove exists', async () => {
      const notExist = 'does not exist',
        { sendStub, statusStub } = await setup_delete({ id: notExist });

      expect(statusStub).to.be.calledWith(400);
      expect(sendStub).to.be.calledWith({
        message: `No record was found for id ${notExist}`
      });
    });

    it('removes a record from the db', async () => {
      const doesExist = 'some existing id',
        { sendStub, statusStub } = await setup_delete({ id: doesExist });

      expect(statusStub).to.be.calledOnceWith(200);
      expect(sendStub).to.be.calledOnceWith({
        message: `The record associated to id ${doesExist} has been removed.`
      });
    });

    it('catches errors', async () => {
      const throws = 'some error',
        { __, sendStub, statusStub } = await setup_delete({ throws });

      expect(statusStub).to.be.calledOnceWith(500);
      expect(sendStub).to.be.calledOnceWith({
        message: 'There was an error removing the subscription'
      });
      expect(__.log).to.be.calledOnceWith('error', throws);
    });
  });
});
