'use strict';

const routes = require('./routes'),
  logger = require('../../../universal/log'),
  log = logger.setup({ file: __filename });

/**
 * initialize the permissions plugin
 *
 * @param {Function} hasPermissions
 * @return {Function}
 */
function init(hasPermissions) {
  return (router) => {
    try {
      return routes(router, hasPermissions);
    } catch (e) {
      log('error', e);
    }
  };
}

module.exports = init;
