'use strict';

const routes = require('./routes'),
  logger = require('../../../universal/log'),
  log = logger.setup({ file: __filename });

/**
 * initialize the permissions plugin
 *
 * @param {Function} hasPermissions
 * @param {Router} [userRouter]
 *
 * @returns {Function}
 */
function init(hasPermissions, userRouter) {
  return (router) => {
    try {
      return routes(router, hasPermissions, userRouter);
    } catch (e) {
      log('error', e);
    }
  };
}

module.exports = init;
