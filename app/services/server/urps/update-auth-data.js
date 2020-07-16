'use strict';

const cache = require('../cache'),
  { refreshAuthToken } = require('../cognito');

/**
 * if session.auth doesn't have a idToken or has expired, make sure it's updated
 *
 * @param {object} session - req.session
 * @param {object} locals
 */
module.exports = async (session, locals) => {
  const currentTime = Date.now(),
    { auth = {} } = session;

  if (!auth.idToken) {
    const key = `cognito-auth--${locals.user.username.toLowerCase()}`;

    Object.assign(auth, JSON.parse(await cache.get(key) || '{}'));
    cache.del(key);
  }

  if (auth.expires < currentTime) {
    Object.assign(auth, await refreshAuthToken(auth));
  }

  session.auth = auth;
};
