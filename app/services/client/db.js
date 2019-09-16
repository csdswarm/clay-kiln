'use strict';

/**
 * This is the client-side implementation of the DB services (../server/db).
 *
 * Currently it only exports two functions, `get` and `put`.
 *
 * These maintain the same function signatures as the server-side db
 * service. If you need more of the same services that the db service
 * exports then add them to this file and export it. If you are converting
 * more functions then they should maintain the same function signature
 * as closely as possible OR you will have to test which environment you're
 * running in inside the `model.js`
 */

const rest = require('../universal/rest'),
  utils = require('../universal/utils'),
  ENDPOINT_MAP = {
    '/_valid_source/items': {
      get: '/valid-source',
      put: '/valid-source'
    }
  };

/**
 * maps the db endpoint to a different enpoint
 *
 * @param {string} ref
 * @param {string} method
 *
 * @return {string}
 */
function mapRef(ref, method) {
  const path = ref.replace(window.location.host, '');

  if (ENDPOINT_MAP[path]) {
    ref = ref.replace(path, ENDPOINT_MAP[path][method]);
  }

  return ref;
}

function get(ref, locals) {
  return rest.get(utils.uriToUrl(mapRef(ref, 'get'), locals));
}

function put(ref, data, locals) {
  // Pass true for the authentication flag
  return rest.put(utils.uriToUrl(mapRef(ref, 'put'), locals), data, true);
}

module.exports.get = get;
module.exports.put = put;
