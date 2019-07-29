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

// /**
//  * REQUEST (does not reject on errors so we can pass the status code)
//  * @param {string} url
//  * @param {object} [opts] See https://github.github.io/fetch/#options
//  * @return {Promise}
//  */
// module.exports.request = async (url, opts) => {
//   const response = await fetch(url, opts),
//     body = await response.json(),
//     { status, statusText } = response;

//   return { status, statusText, body };
// };
/**
 * REQUEST
 * @param {string} url
 * @param {object} [opts] See https://github.github.io/fetch/#options
 * @return {Promise}
 */
module.exports.request = function (url, opts) {
  return fetch(url, opts).then(checkStatus).then(function (res) {
    return {
      status: res.status,
      statusText: res.statusText,
      body: res.json()
    };
  });
};

/**
 * GET
 * @param {string} url
 * @param {object} [opts] See https://github.github.io/fetch/#options
 * @return {Promise}
 */
module.exports.get = function (url, opts) {
  const conf = _defaults({method: 'GET'}, opts);

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
module.exports.put = function (url, data, isAuthenticated) {
  const payload = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  if (isAuthenticated) {
    authenticate(payload);
  }

  return fetch(url, payload).then(checkStatus).then(function (res) { return res.json(); });
};

/**
 * POST
 * note: primarily used for elastic search
 * @param  {string}  url
 * @param  {object|array}  data
 * @param  {Boolean} isAuthenticated set to true if making POST requests to Clay
 * @return {Promise}
 */
module.exports.post = function (url, data, isAuthenticated) {
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  if (isAuthenticated) {
    authenticate(payload);
  }

  return fetch(url, payload).then(checkStatus).then(function (res) { return res.json(); });
};
