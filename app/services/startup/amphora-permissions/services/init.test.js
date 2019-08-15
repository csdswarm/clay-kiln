'use strict';
const { expect, assert } = require('chai'),
  sinon = require('sinon'),
  routes = sinon.stub().returns('routesStub'),
  proxyquire = require('proxyquire'),
  init = proxyquire('./init', {
    './routes': routes
  });

describe('init', function () {
  it('takes a function and returns a function that passes it as an argument', function () {
    const router = sinon.stub(),
      permissionsFunc = sinon.stub(),
      initFunc = init(permissionsFunc),
      result = initFunc(router);

    assert(routes.calledWith(router, permissionsFunc));
    expect(result).to.eql('routesStub');
  });
});
