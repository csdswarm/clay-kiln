'use strict';

const axios = require('axios'),
  qs = require('qs'),
  jwt = require('jsonwebtoken'),
  log = require('../universal/log').setup({ file: __filename }),
  cache = require('../server/cache'),
  { getUser } = require('../server/cognito'),
  { SECOND, HOUR } = require('../universal/constants').time,
  STORE_IN_CACHE_SECONDS = 4 * HOUR / SECOND,

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
          { access_token: token, refresh_token: refreshToken, expires_in } = response.data,
          { email: userName } = await getUser(token),
          { device_key: deviceKey } = jwt.decode(token);

        await cache.set(`cognito-auth--${userName.toLowerCase()}`,
          JSON.stringify({
            token,
            refreshToken,
            expires: currentTime + ((expires_in || 0) * SECOND),
            deviceKey,
            lastUpdated: currentTime
          }),
          STORE_IN_CACHE_SECONDS
        );

        res.send(response.data);
      } catch (e) {
        log('error', 'There was an error attempting to process the oAuth2 token for cognito', e);
        res.status(e.response.status).json(e.response.data);
      }
    });
  };

module.exports.inject = inject;
