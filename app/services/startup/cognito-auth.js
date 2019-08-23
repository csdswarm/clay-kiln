'use strict';

const axios = require('axios'),
  _get = require('lodash/get'),
  qs = require('qs'),
  jwt = require('jsonwebtoken'),
  cache = require('../server/cache'),
  { getUser } = require('../server/cognito'),
  { SECOND } = require('../universal/constants').time,
  STORE_IN_CACHE_SECONDS = 60,

  /**
   * Setup cognito routes so we can be a man in the middle to get the tokens that are returned
   * since they are not exposed in passport.  Amphora 8 should allow this logic to be in the permissions plugin
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
          currentTime = Date.now(),
          { access_token, refresh_token, expires_in } = response.data,
          userName = _get(await getUser(access_token), 'email', '').toLowerCase();

        // response.data has the tokens at this point
        await cache.set(`cognito-auth--${userName}`,
          {
            token: access_token,
            refreshToken: refresh_token,
            expires: currentTime + ((expires_in || 0) * SECOND),
            deviceKey: _get(jwt.decode(access_token), 'device_key', ''),
            lastUpdated: currentTime
          },
          STORE_IN_CACHE_SECONDS
        );

        res.send(response.data);
      } catch (e) {
        res.status(e.response.status).json(e.response.data);
      }
    });
  };

module.exports.inject = inject;
