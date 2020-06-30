'use strict';

const url = require('url');

/**
 * Performs a general httpRequest, with much of the error handling built in
 *
 * @param {Object} params
 * @param {('http'|'https')} params.http
 * @param {ClientRequestArgs|Object} params.options
 * @returns {Promise<{result: ('success'|'fail'), data: string, params: Object}>}
 */
const httpRequest_v1 = params => {
  const { http, body, ...options } = params;

  return new Promise((resolve, reject) => {
    try {
      const conn = require(http);

      const parsedOptions = options.url ? {...options, ...url.parse(options.url)} : options;

      const req = conn.request(parsedOptions, res => {
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => resolve({ result: 'success', data: Buffer.concat(data).toString(), params }));
        res.on('error', error => reject({ result: 'fail', params, error }));
      });
      req.on('error', error => reject({ result: 'fail', params, error }));

      req.write(JSON.stringify(body))
      req.end();

    } catch (error) {
      reject({ result: 'fail', params, error })
    }
  });
}

module.exports = {
  v1: httpRequest_v1
};
