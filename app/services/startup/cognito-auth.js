'use strict';

const axios = require('axios'),
  qs = require('qs'),
  jwt = require('jsonwebtoken'),
  log = require('../universal/log').setup({ file: __filename }),
  cache = require('../server/cache'),
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
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in,
            id_token: idToken
          } = response.data,
          { device_key: deviceKey } = jwt.decode(accessToken),
          { email } = jwt.decode(idToken);

        await cache.set(`cognito-auth--${email.toLowerCase()}`,
          JSON.stringify({
            accessToken,
            deviceKey,
            expires: currentTime + ((expires_in || 0) * SECOND),
            idToken,
            lastUpdated: currentTime,
            refreshToken
          }),
          STORE_IN_CACHE_SECONDS
        );

        // this validate step is defined here
        // https://entercomdigitalservices.atlassian.net/wiki/spaces/AUDIOADMIN/pages/628753835/JWT%2BClient%2BAuthentication%2BStrategy
        await axios.post(
          process.env.URPS_AUTHORIZATIONS_URL + '/users/validate',
          {},
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        res.send(response.data);
      } catch (e) {
        const errMsg = 'There was an error attempting to process the oAuth2 token for cognito';

        log('error', errMsg, e);

        res.status(500).send(errMsg);
      }
    });
  };

module.exports.inject = inject;
