'use strict';

/**
 * Performs an elastic search
 * @param {Object} params
 * @param {Object} params.query an elastic search query
 * @param {string} params.hostname the hostname of the elastic search server
 * @param {string} params.http the protocol of the elastic search server
 * @param {string} [params.index] the index to search, defaults to empty
 * @param {boolean} [params.yaml] whether or not to return results as yaml. default is false
 * @param {number} [params.size] how many records to return. defaults to 10.
 * @param {Object} [params.headers] any additional headers you want sent with the request. default is Content-Type=application/json
 * @returns {Promise<{result: ('success'|'fail'), data?: Object, params: Object, error?: Object}>}
 */
function esQuery_v1(params) {
  const { query, hostname, http, index = '', yaml = false, size = 10, headers = {} } = params;
  console.log(`Querying elastic on ${hostname}, index: ${index} for: ${JSON.stringify(query)}`);

  return new Promise((resolve, reject) => {
    try {
      const conn = require(http);

      const searchParams = [`size=${size}`];
      yaml && searchParams.push('format=yaml');

      const options = {
        method: 'POST',
        port: '9200',
        path: `${index || ''}/_search${searchParams.length ? '?' + searchParams.join('&') : ''}`,
        hostname,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        }
      };

      const req = conn.request(options, res => {
        const chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function () {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          resolve({ result: 'success', data, params })
        });

        res.on('error', error => reject({ result: 'fail', params, error }))
      });

      req.write(JSON.stringify(query));
      req.end();

    } catch (error) {
      reject({ result: 'fail', params, error })
    }
  });
}

module.exports = {
  v1: esQuery_v1
};
