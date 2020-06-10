'use strict';

const axios = require('../../app/node_modules/axios'),
  { prettyJSON } = require('./base'),
  formatAxiosError = require('./format-axios-error');

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
  const { query, hostname, http, index = '', yaml = false, size = 10, headers = {}, port } = params;
  console.log(`Querying elastic on ${hostname}, index: ${index} for: ${JSON.stringify(query)}`);

  return new Promise((resolve, reject) => {
    try {
      const conn = require(http);

      const searchParams = [`size=${size}`];
      yaml && searchParams.push('format=yaml');

      const options = {
        method: 'POST',
        port,
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

/**
 * Performs an elastic search
 *
 * I bumped the version because v1
 *   - required you to pass the size separately from the query which should
 *     be unnecessary.
 *   - contained a lot of unused parameters.  If we need any of them then in the
 *     future they can be added as an object in a third parameter which can be
 *     done without bumping the version.
 *   - should have used axios to simplify the request logic
 *
 * @param {object} query an elastic search query
 * @param {object} params
 * @param {string} params.hostname - the hostname of the elastic search server
 * @param {string} params.http - the protocol of the elastic search server
 * @param {string} params.index - the index to search, defaults to empty
 * @param {boolean} [params.logError] - whether this method should log the error before rethrowing it
 * @returns {Promise<{object}>}
 */
async function esQuery_v2(query, { hostname, http, index, logError = false, port }) {
  try {
    if (!hostname || !http || !index) {
      throw new Error(
        'make sure to pass hostname, http and index as params'
      );
    }

    const elasticUrl = `${http}://${hostname}:${port}/${index}/_search`,
      { data: result } = await axios.post(elasticUrl, query)

    return result;
  } catch (err) {
    if (logError) {
      console.error(
        'an error occurred when fetching data from elasticsearch'
        + '\n\n' + err.stack
      );

      console.log('\nquery: ' + prettyJSON(query));

      if (err.response) {
        console.error('\n\n' + formatAxiosError(err));
      }
    }

    throw err;
  }
}

module.exports = {
  v1: esQuery_v1,
  v2: esQuery_v2,
};
