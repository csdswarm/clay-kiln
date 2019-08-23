'use strict';
const _get = require('lodash/get'),
  _set = require('lodash/set'),
  cache = require('../../services/server/cache'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  urps = require('../../services/server/urps'),
  MINUTE = 60000,
  PERM_CHECK_INTERVAL = 5 * MINUTE;

async function loadPermissions(req, res) {
  try {
    const session = _get(req, 'session'),
      user = _get(res, 'locals.user', {}),
      loginData = session.auth || await cache.get(user.username),
      permissions = loginData.permissions || await urps.getAllPermissions(loginData.token);

    session.auth = loginData;
    session.auth.permissions = permissions;
    user.permissions = permissions;

  } catch (error) {
    log('error', `There was an error in authorizations.`, error)
  }
}


async function middleware(req, res, next) {
  try {
    await loadPermissions(req, res, next);

  } catch (error) {
    log('error', `There was an error applying the routing middleware.`, error);
  }
  next();
}

module.exports = middleware;
