'use strict';
const getJSONP = require('jsonp-client'),
  _defaults = require('lodash/defaults');

// global
require('isomorphic-fetch');

/**
 * if you're doing api calls to Clay, authenticate on the server/client side
 * @param  {object} payload
 * @return {object}
 */
function authenticate(payload) {
  // the access key is stringified at runtime
  payload.headers.Authorization = 'Token ' + process.env.CLAY_ACCESS_KEY;
  payload.credentials = 'same-origin';
  return payload;
}

/**
 * add fake callback for the client-side code
 * @returns {string}
 */
function addFakeCallback() {
  return ('&callback=cb' + Math.random()).replace('.', '');
}

/**
 * Makes a request for PUT/POST/DELETE
 *
 * @param {string} method
 * @param {string} url
 * @param {object} data
 * @param {boolean} isAuthenticated
 *
 * @return {Promise<Response | never>}
 */
function makeRequest(method, url, data, isAuthenticated) {
  const payload = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  if (isAuthenticated) {
    authenticate(payload);
  }

  return fetch(url, payload).then(checkStatus).then(function (res) { return res.json(); });
}

/**
 * check status after doing http calls
 * note: this is necessary because fetch doesn't reject on errors,
 * only on network failure or incomplete requests
 * @param  {object} res
 * @return {object}
 * @throws {Error} on non-2xx status
 */
function checkStatus(res) {
  if (res.ok) {
    return res;
  } else {
    const error = new Error(res.statusText);

    error.response = res;
    throw error;
  }
}

/**
 * REQUEST (does not reject on errors so we can pass the status code)
 * @param {string} url
 * @param {object} [opts] See https://github.github.io/fetch/#options
 * @return {Promise}
 */
module.exports.request = async (url, opts) => {
  const response = await fetch(url, opts),
    contentType = response.headers.get('Content-Type'),
    { status, statusText } = response;

  let body;

  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { status, statusText, body };
};

/**
 * GET
 * @param {string} url
 * @param {object} [opts] See https://github.github.io/fetch/#options
 * @return {Promise}
 */
module.exports.get = function (url, opts) {
  const conf = _defaults({ method: 'GET' }, opts);

  return fetch(url, conf).then(checkStatus).then(function (res) { return res.json(); });
};

/**
 * GET JSONP (from a third-party api that requires jsonp)
 * @param  {string} url
 * @return {Promise}
 */
module.exports.getJSONP = function (url) {
  return new Promise(function (resolve, reject) {
    // note: this handles its own status checking
    getJSONP(url + addFakeCallback(), function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * GET HTML/text
 * @param  {string} url
 * @return {Promise}
 */
module.exports.getHTML = function (url) {
  return fetch(url).then(checkStatus).then(function (res) { return res.text(); });
};

/**
 * PUT
 * @param  {string}  url
 * @param  {object|array}  data
 * @param  {Boolean} isAuthenticated set to true if making PUT requests to Clay
 * @return {Promise}
 */
module.exports.put = async function (url, data, isAuthenticated) {
  return await makeRequest('PUT', url, data, isAuthenticated);
};

/**
 * POST
 * note: primarily used for elastic search
 * @param  {string}  url
 * @param  {object|array}  data
 * @param  {Boolean} [isAuthenticated] set to true if making POST requests to Clay
 * @return {Promise}
 */
module.exports.post = async function (url, data, isAuthenticated) {
  return await makeRequest('POST', url, data, isAuthenticated);
};

/**
 * DELETE
 *
 * @param  {string}  url
 * @param  {object|array}  data
 * @param  {Boolean} [isAuthenticated] set to true if making POST requests to Clay
 * @return {Promise}
 */
module.exports.delete = async function (url, data, isAuthenticated) {
  return await makeRequest('DELETE', url, data, isAuthenticated);
};
