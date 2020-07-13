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
});

