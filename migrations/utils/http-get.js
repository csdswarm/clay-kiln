'use strict';

/**
 * Basically a simple http GET, to retrieve data or markup from a web node. Assumes results are text.
 * @param {Object} params
 * @param {string} params.url - the url to retrieve
 * @param {protocol} params.http - the http (or https) protocol to use
 * @returns {Promise<string>}
 */
const httpGet_v1 = params => {
  const { url, http } = params;

  return new Promise((resolve, reject) => {
    try {
      const conn = require(http);

      const req = conn.get(`${http}://${url.replace(/^https?:\/\//, '')}`, res => {
        const chunks = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function () {
          resolve(Buffer.concat(chunks).toString());
        });

        res.on('error', error => reject({ result: 'fail', params, error }))
      });

      req.on('error', error => reject({ result: 'fail', params, error }))

    } catch (error) {
      reject({ result: 'fail', params, error });
    }
  });
};

module.exports = {
  v1: httpGet_v1
};
