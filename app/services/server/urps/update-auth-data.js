'use strict';

const { refreshAuthToken } = require('../cognito'),
  cache = require('../cache');

/**
 * if session.auth doesn't have a token or has expired, make sure it's updated
 *
 * @param {object} session - req.session
 * @param {object} locals
 */
module.exports = async (session, locals) => {
  const currentTime = Date.now(),
    { auth = {} } = session;

  if (!auth.token) {
    const key = `cognito-auth--${locals.user.username.toLowerCase()}`;

    Object.assign(auth, JSON.parse(await cache.get(key) || '{}'));
    cache.del(key);
  }

  if (auth.expires < currentTime) {
    Object.assign(auth, await refreshAuthToken(auth));
  }

  session.auth = auth;
};
