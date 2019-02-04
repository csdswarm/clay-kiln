'use strict';

const rest = require('../universal/rest');

/**
 * Get data
 *
 * @param {string} route
 * @returns {*}
 */
function get(route) {
  return rest.get(route).then(data => {
    return data;
  });
}

module.exports.get = get;
