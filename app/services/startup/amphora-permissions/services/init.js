'use strict';

const routes = require('./routes');

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
      console.log(e); //todo use logger
    }
  };
}

module.exports = init;
