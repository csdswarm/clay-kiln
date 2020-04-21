'use strict';

const proxyquire = require('proxyquire'),
  { assert, expect } = require('chai'),
  sinon = require('sinon');

describe('cognito tests', () => {
  const env = { ...process.env };

  // generates standard proxies for required components used by cognito.js
  // and allows stubs and spies to be injected as needed
  function requireCognitoStandard({ initiateAuth, getUser, log }) {
    return proxyquire('./cognito', {
      'aws-sdk': {
        CognitoIdentityServiceProvider: function () {
          this.initiateAuth = initiateAuth;
          this.getUser = getUser;
        }
      },
      '../universal/log': { setup: () => log }
    });
  }

  function resetGlobals() {
    process.env = { ...env };
  }

  afterEach(resetGlobals);

  describe('refreshAuthToken', () => {
    it('requests an update for a cognito token', async () => {
      let clock;

      try {
        process.env.COGNITO_CONSUMER_KEY = 'YOUR KEY TO THE FUTURE';

        const fakeDate = { now: (new Date('March 14, 2015 9:26:54')).valueOf() };

        clock = sinon.useFakeTimers(fakeDate);

        const
          authResults = { AuthenticationResult: { AccessToken: 'ACCESS... GRANTED', ExpiresIn: 3600 } },
          spy = sinon.stub().callsArgWith(1, undefined, authResults),
          cognito = requireCognitoStandard({ initiateAuth: spy }),
          refreshToken = 'REFRESH ME',
          deviceKey = 'I AM THE KEY MASTER',
          result = await cognito.refreshAuthToken({ refreshToken, deviceKey });

        assert(spy.calledWithMatch({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: 'YOUR KEY TO THE FUTURE',
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
            DEVICE_KEY: deviceKey
          }
        }));

        expect(result).to.eql({
          refreshToken,
          deviceKey,
          token: authResults.AuthenticationResult.AccessToken,
          expires: fakeDate.now + 3600000,
          lastUpdated: fakeDate.now
        });
      } finally {
        if (clock) {
          clock.restore();
        }
      }
    });

    it('adds a secret hash if COGNITO_CONSUMER_SECRET is set', async () => {
      process.env.COGNITO_CONSUMER_KEY = 'THE KEY, IS TO HAVE A KEY';
      process.env.COGNITO_CONSUMER_SECRET = 'SHHHH IT\'S A SECRET';
      const
        authResults = { AuthenticationResult: { AccessToken: '25¢', ExpiresIn: 3600 } },
        spy = sinon.stub().callsArgWith(1, undefined, authResults),
        cognito = requireCognitoStandard({ initiateAuth: spy }),
        refreshToken = 'LEMONADE',
        deviceKey = '1-2-3';

      await cognito.refreshAuthToken({ refreshToken, deviceKey });

      assert(spy.calledWithMatch({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'THE KEY, IS TO HAVE A KEY',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          DEVICE_KEY: deviceKey,
          SECRET_HASH: 'SHHHH IT\'S A SECRET'
        }
      }));
    });

    it('handles errors', async () => {
      const
        error = 'No Access For You',
        initiateAuth = sinon.stub().callsArgWith(1, error),
        logSpy = sinon.spy(),
        cognito = requireCognitoStandard({ initiateAuth, log: logSpy }),
        refreshToken = 'LEMONADE',
        deviceKey = '1-2-3';

      await cognito.refreshAuthToken({ refreshToken, deviceKey });

      assert(logSpy.calledWith(
        'error',
        'There was an error attempting to refresh the cognito access token',
        error));
    });
  });

  describe('getUser', () => {
    it('retrieves additional user information from cognito', async () => {
      const
        userData = {
          UserAttributes: [
            { Name: 'email', Value: 'joe.schmoe@idaho.gov' },
            { Name: 'address', Value: '1234 Potato Ln' },
            { Name: 'city', Value: 'Boise' },
            { Name: 'state', Value: 'ID' }]
        },
        spy = sinon.stub().callsArgWith(1, undefined, userData),
        accessToken = 'HI, THIS IS JOE. GO GET SOME INFO ABOUT ME.',
        cognito = requireCognitoStandard({ getUser: spy }),
        result = await cognito.getUser(accessToken);

      assert(spy.calledWithMatch({ AccessToken: accessToken }));
      expect(result).to.eql({
        email: 'joe.schmoe@idaho.gov',
        address: '1234 Potato Ln',
        city: 'Boise',
        state: 'ID'
      });
    });

    it('handles errors', async () => {
      const
        error = 'Umm... Who is That?',
        getUser = sinon.stub().callsArgWith(1, error),
        logSpy = sinon.spy(),
        cognito = requireCognitoStandard({ getUser, log: logSpy }),
        accessToken = 'Some person trying to dupe the system';

      await cognito.getUser(accessToken);

      assert(logSpy.calledWith(
        'error',
        'There was an error trying to get information about the cognito user',
        error));
    });
  });
});
