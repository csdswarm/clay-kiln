'use strict';

/**
 * README
 *  - This file is necessary because the default sign out operation doesn't log
 *    you out of cognito's oauth.  This means that unless you remove your
 *    cookies related to the cognito domain, every time you click the cognito
 *    login you will automatically be logged back in as the user you last logged
 *    in as.
 */

const qs = require('qs');

const {
  CLAY_SITE_HOST: host,
  CLAY_SITE_PROTOCOL: protocol,
  COGNITO_CONSUMER_KEY: client_id,
  COGNITO_SERVER: cognitoServer
} = process.env;

module.exports = router => {
  router.get('/rdc/sign-out', (req, res) => {
    let redirectUri = `${protocol}://${host}/_auth/logout`;

    if (res.locals.user.provider === 'cognito') {
      const params = qs.stringify({
        client_id,
        logout_uri: redirectUri
      });

      redirectUri = `${cognitoServer}/logout?${params}`;
    }

    res.redirect(redirectUri);
  });
};
