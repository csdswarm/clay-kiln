'use strict';
require('isomorphic-fetch');

/**
 * Returns request's response status and JSON
 * using fetch
 *
 * @param {string} method
 * @param {string} route
 * @param {any} [body]
 * @param {Object} [headers]
 * @returns {Object}
 *
 */
const getFetchResponse = async (method, route, body, headers) => {
  try {
    if (method === 'GET') {
      const response = await fetch(route),
        { status, statusText } = response,
        data = status >= 200 && status < 300 ? await response.json() : await response.text();

      return { status, statusText, data };
    } else {
      const response = await fetch(route, {
          method,
          body: headers && headers['Content-Type'] === 'application/json' ? JSON.stringify(body) : body,
          headers: headers
        }),
        { status, statusText } = response;

      if (status >= 200 && status < 300) {
        const data = headers && headers['Content-Type'] === 'application/json'
          ? await response.json()
          : await response.text();

        return { status, statusText, data };
      } else {
        return { status, statusText, data: statusText };
      }
    }
  } catch (e) {
    return { status: 500, statusText: e, data: e };
  }
};

module.exports.getFetchResponse = getFetchResponse;
