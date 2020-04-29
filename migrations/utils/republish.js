'use strict';

const httpRequest = require('./http-request').v1;

/**
 * Does a basic republish of the page or component
 * @param {Object} params
 */
function republish_v1(params) {
  const { hostname, http, path, headers = {} } = params;
  const options = {
    method: 'PUT',
    path: path.replace(/@published$/, '') + '@published',
    hostname,
    headers: {
      Authorization: 'token accesskey',
      ...headers,
    }
  };

  return httpRequest({http, options});
}

module.exports = { v1: republish_v1 };
