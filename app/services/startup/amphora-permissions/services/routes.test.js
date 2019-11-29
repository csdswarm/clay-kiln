'use strict';
const { expect, assert } = require('chai'),
  sinon = require('sinon'),
  expressRouter = {
    use: sinon.stub(),
    put: sinon.stub(),
    all: sinon.stub()
  },
  express = { Router: () => expressRouter },
  proxyquire = require('proxyquire'),
  routes = proxyquire('./routes', {
    express
  }),
  send = sinon.stub();
let res = {};

describe('routes', function () {
  beforeEach(function () {
    expressRouter.use.reset();
    expressRouter.put.reset();
    expressRouter.all.reset();

    send.reset();
    res = {
      status: sinon.stub().returns({ send }),
      locals: {
        user: {
          username: 'testing'
        }
      }
    };
  });
  it('sets up routes for pages and components', function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true);

    routes(router, permissionsFunc);

    expect(router.use.callCount).to.eql(1);
    assert(expressRouter.put.firstCall.args[0].includes('/_components'));
    assert(expressRouter.put.lastCall.args[0].includes('/_pages/*'));
  });
  it('adds userRoute if passed in', function () {
    const router = { use: sinon.stub() },
      userRouter = { },
      permissionsFunc = sinon.stub().returns(true);

    routes(router, permissionsFunc, userRouter);

    expect(expressRouter.use.callCount).to.eql(2);
    expect(expressRouter.use.secondCall.args[1]).to.eql(userRouter);
  });
  it('middleware calls next on successful permissions for components', async function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true),
      next = sinon.stub();

    routes(router, permissionsFunc);
    await expressRouter.put.firstCall.args[1]({ uri: 1, body: 2 }, res, next);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, res.locals));

    expect(next.callCount).to.eql(1);
  });
  it('middleware calls next on successful permissions for pages', async function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(true),
      next = sinon.stub();

    routes(router, permissionsFunc);
    await expressRouter.put.lastCall.args[1]({ uri: 1, body: 2}, res, next);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, res.locals));
    expect(next.callCount).to.eql(1);
  });
  it('middleware calls next with robot user and no permission for pages', async function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(false),
      next = sinon.stub();

    res.locals.user = {};
    routes(router, permissionsFunc);
    await expressRouter.put.lastCall.args[1]({ uri: 1, body: 2 }, res, next);

    expect(permissionsFunc.callCount).to.eql(0);
    expect(next.callCount).to.eql(1);
  });
  it('middleware calls send on unsuccessful permissions for pages', async function () {
    const router = { use: sinon.stub() },
      permissionsFunc = sinon.stub().returns(false);

    routes(router, permissionsFunc);
    await expressRouter.put.lastCall.args[1]({ uri: 1, body: 2 }, res, null);

    expect(permissionsFunc.callCount).to.eql(1);
    assert(permissionsFunc.calledWith(1, 2, res.locals));
    expect(res.status.callCount).to.eql(1);
    assert(res.status.calledWith(403));
    expect(send.callCount).to.eql(1);
    assert(send.calledWith({ error: 'Permission Denied' }));
  });
});
