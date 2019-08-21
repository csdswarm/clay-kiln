'use strict';

const util = require('util'),
  axios = require('axios'),
  _get = require('lodash/get'),
  qs = require('qs'),
  AWS = require('aws-sdk'),
  jwt = require('jsonwebtoken'),
  cache = require('../server/cache'),
  SECOND = 1000,
  TTL_SECONDS = 60,
  /**
   * Setup cognito routes so we can be a man in the middle to get the tokens that are returned
   * since they are not exposed in passport.  Amphora 8 should allow this logic to be a in the permissions plugin
   *
   * @param {object} app Express app
   */
  inject = (app) => {
    app.get('/oauth2/authorize', (req, res) => {
      res.redirect(301, `${process.env.COGNITO_SERVER}${req.url}`);
    });

    app.post('/oauth2/token', async (req, res) => {
      const options = {
        method: req.method,
        url: `${process.env.COGNITO_SERVER}${req.url}`,
        data: qs.stringify(req.body)
      };

      try {
        const response = await axios(options),
          cognitoClient = new AWS.CognitoIdentityServiceProvider(),
          getUser = util.promisify(cognitoClient.getUser).bind(cognitoClient),
          userData = await getUser({AccessToken: _get(response, 'data.access_token', '')}),
          userAttributes = _get(userData,'UserAttributes', []),
          userName = _get(userAttributes.find(({Name}) => Name === 'email'),'Value','').toLowerCase(),
          {access_token: token, refresh_token: refreshToken, expires_in: expiresIn} = response.data;

        // response.data has the tokens at this point
        await cache.set(`${userName}`,
          {
            token,
            refreshToken,
            expires: Date.now() + ((expiresIn || 0) * SECOND),
            deviceKey: (jwt.decode(token) || {}).device_key,
            lastUpdated: Date.now()
          },
          TTL_SECONDS
        );

        res.send(response.data);
      } catch (e) {
        res.status(e.response.status).json(e.response.data);
      }
    });
  };

module.exports.inject = inject;
