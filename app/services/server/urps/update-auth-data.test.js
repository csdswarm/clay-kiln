'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { expect } = require('chai');

describe('getFromUrps', () => {
  const getMockData = ({ auth }) => ({
      locals: { user: {
        username: 'test@entercom.com'
      } },
      session: { auth }
    }),
    refreshAuthToken = sinon.spy(() => ({ isUpdated: true })),
    cache = {
      del: sinon.spy(),
      get: sinon.spy()
    },
    getExpectedData = locals => ({
      key: `cognito-auth--${locals.user.username.toLowerCase()}`
    }),
    updateAuthData = proxyquire('./update-auth-data', {
      '../cache': cache,
      '../cognito': { refreshAuthToken }
    }),
    allSpies = [refreshAuthToken, ...Object.values(cache)];

  beforeEach(() => {
    allSpies.forEach(spy => spy.resetHistory());
  });

  it('gets updated auth info from the cache - not expired', async () => {
    const { locals, session } = getMockData({ auth: {} }),
      expected = getExpectedData(locals);

    await updateAuthData(session, locals);

    expect(cache.get.calledOnce).to.be.true;
    expect(cache.del.calledOnce).to.be.true;
    expect(refreshAuthToken.notCalled).to.be.true;

    expect(cache.get.firstCall.args).to.deep.equal([expected.key]);
    expect(cache.del.firstCall.args).to.deep.equal([expected.key]);
  });

  it('refreshes expired auth data - does not get from cache', async () => {
    const { locals, session } = getMockData({
      auth: {
        expires: Date.now() - 1000,
        idToken: {}
      }
    });

    await updateAuthData(session, locals);

    expect(session.auth.isUpdated).to.be.true;

    expect(cache.get.notCalled).to.be.true;
    expect(cache.del.notCalled).to.be.true;
    expect(refreshAuthToken.calledOnce).to.be.true;

    expect(refreshAuthToken.firstCall.args).to.deep.equal([session.auth]);
  });
});
