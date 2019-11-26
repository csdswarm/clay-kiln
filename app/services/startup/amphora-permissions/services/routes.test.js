'use strict';
const { expect, assert } = require('chai'),
  sinon = require('sinon'),
  expressRouter = {
    use: sinon.stub(),
    put: sinon.stub()
  },
  express = { Router: () => expressRouter },
  proxyquire = require('proxyquire'),
  routes = proxyquire('./routes', {
    express
  });

describe('routes', function () {
  beforeEach(function () {
    expressRouter.use.reset();
    expressRouter.put.reset();
  });
  it('sets up routes for pages and components', function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true);

    routes(router, permissionsFunc);
    expect(router.use.callCount).to.eql(1);
    assert(expressRouter.put.firstCall.args[0].includes('/_components'));
    assert(expressRouter.put.lastCall.args[0].includes('/_pages/*'));
  });
  it('middleware calls next on successful permissions for components', function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true),
      next = sinon.stub();

    routes(router, permissionsFunc);
    expressRouter.put.firstCall.args[1]({ uri: 1, body: 2, user:3 }, null, next);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, 3));
    expect(next.callCount).to.eql(1);
  });
  it('middleware calls next on successful permissions for pages', function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true),
      next = sinon.stub();

    routes(router, permissionsFunc);
    expressRouter.put.lastCall.args[1]({ uri: 1, body: 2, user:3 }, null, next);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, 3));
    expect(next.callCount).to.eql(1);
  });
  it('middleware calls send on unsuccessful permissions for pages', function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(false),
      send = sinon.stub(),
      status = sinon.stub().returns({ send }),
      res = { status };

    routes(router, permissionsFunc);
    expressRouter.put.lastCall.args[1]({ uri: 1, body: 2, user:3 }, res, null);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, 3));
    expect(status.callCount).to.eql(1);
    assert(status.calledWith(403));
    expect(send.callCount).to.eql(1);
    assert(send.calledWith({ error: 'Permission Denied' }));
  });
});
