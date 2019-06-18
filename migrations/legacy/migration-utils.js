// IMPORTANT: follow open/closed principle. The following methods may be extended
// but the public interface may not be changed in a way that could break existing
// legacy scripts that might be using it.

// If you must do so, create another version
// ex:
// ```
// v2 = {...v1, clayImport: clayImportV2 }
// module.exports = { v1, v2 };
// ```
// where clayImportV2 is a function with a different structure that clayImport in v1
// or where it does significantly different things that would break a prior migration
// - CSD

const _get = require('../../app/node_modules/lodash/get');
const _chunk = require('../../app/node_modules/lodash/chunk');
const claycli = require('../../app/node_modules/claycli');
const YAML = require('../../app/node_modules/yamljs');

const DEFAULT_HOST = 'clay.radio.com';
const HTTP = { http: 'http' };
const HTTPS = { http: 'https' };

// The following are simple, self-explanatory functions, so no jsdocs given
const prettyJSON = obj => JSON.stringify(obj, null, 2);
const toYaml = obj => YAML.stringify(obj, 8, 2);
const clone = obj => obj && JSON.parse(JSON.stringify(obj));


/**
 * given a host, attempts to get the configured values for that host
 * @param {string} host
 * @returns {{http: string, es: {http: string, hostname: string}}}
 */
function getHostInfo(host) {
  const hostInfo = {
    [DEFAULT_HOST]: { ...HTTP, es: { ...HTTP, hostname: DEFAULT_HOST } },
    'dev-clay.radio.com': { ...HTTPS, es: { ...HTTP, hostname: 'dev-es.radio-dev.com' } },
    'stg-clay.radio.com': { ...HTTPS, es: { ...HTTP, hostname: 'es.radio-stg.com' } },
    'www.radio.com': { ...HTTPS, es: { ...HTTP, hostname: 'es.radio-prd.com' } },
  };
  return hostInfo[host];
}

/**
 * Gets environmental values for clay and elastic based on host
 * @param {string} host
 * @returns {Object}
 */
function parseHost(host) {
  let data, url, message = '';

  if (!host) {
    message = 'No environment specified. ';
    host = DEFAULT_HOST;
  }

  data = getHostInfo(host);

  if (!data) {
    throw new Error(`Unknown host specified: ${host}`);
  }

  url = `${data.http}://${host}`;
  message += `Updating environment ${url}`;

  return { ...data, url, message };
}

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
function esQuery(params) {
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

/**
 * Imports objects (_components/_pages/_layouts/_lists) into clay
 * @param {Object} params
 * @param {string} params.hostUrl The target url where clay is running
 * @param {(Object|string)} params.payload The data to import into clay (string represents yaml data)
 * @param {boolean} [params.publish] Whether or not the data should be published. default is false
 * @param {string} [params.key] the key to connect to the host with. default is 'demo'
 * @returns {Promise<{result: ('success'|'fail'), params: Object, messages?: Object[], error?: Object}>}
 */
function clayImport(params) {
  let { hostUrl, payload, publish = false, key = 'demo' } = params;
  console.log(`Saving: to: ${hostUrl}`);
  return new Promise((resolve, reject) => {
    try {
      const fromObject = typeof payload === 'object';
      const yaml = true;
      const data = fromObject ? toYaml(payload) : payload;
      let messages = [];

      const options = { key, publish, yaml };
      let res = claycli.import(data, hostUrl, options);

      res.on('data', d => {
        if (_get(d, 'type') === 'error') {
          reject({ result: 'fail', params, error: d })
        } else {
          messages.push(d)
        }
      });
      res.on('end', () => {
        resolve({ result: 'success', messages, params });
      });
      res.on('error', error => reject({ result: 'fail', params, error }))
    } catch (error) {
      reject({ result: 'fail', params, error });
    }
  });
}

/**
 * Exports objects from clay
 * @param {Object} params
 * @param {Object} params.componentUrl the url of the component to export
 * @param {bool} [params.asJson] default is false. If true, returns data as a JSON string, exactly as it came from claycli
 *                               otherwise it coerces it into a js object that can be converted to the type
 *                               of yaml that claycli will accept
 * @returns {Promise<(string | Object)>}
 */
function clayExport(params) {
  const { componentUrl, asJSON = false } = params;
  console.log(`Retrieving: ${componentUrl}`);

  return new Promise((resolve, reject) => {
    try {
      const res = claycli.export.fromURL(componentUrl);
      let data = asJSON ? [] : {};

      res.on('data', d => {
        if (asJSON) {
          data.push(d);
        } else {
          Object.entries(d)
            .forEach(([key, value]) => {
              const props = key.split('/').slice(1);
              const lastProp = props.splice(-1, 1)[0];
              let current = data;
              props
                .forEach(prop => {
                  current[prop] = current[prop] || {};
                  current = current[prop];
                });
              current[lastProp] = value;
            });
        }
      });

      res.on('end', () => {
        if (asJSON) {
          resolve({ result: 'success', data: data.join('\n') });
        } else {
          resolve({ result: 'success', data });
        }
      });

      res.on('error', error => reject({ result: 'fail', params, error }));
    } catch (error) {
      reject({ result: 'fail', params, error });
    }
  });
}


/**
 * Basically a simple http GET, to retrieve data or markup from a web node. Assumes results are text.
 * @param {Object} params
 * @param {string} params.url - the url to retrieve
 * @param {protocol} params.http - the http (or https) protocol to use
 * @returns {Promise<string>}
 */
function httpGet(params) {
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
}

/**
 * Performs a general httpRequest, with much of the error handling built in
 * @param {Object} params
 * @param {('http'|'https')} params.http
 * @param {ClientRequestArgs|Object} params.options
 * @returns {Promise<{result: ('success'|'fail'), data: string, params: Object}>}
 */
function httpRequest(params) {
  const { http, options } = params;
  return new Promise((resolve, reject) => {
    try {
      const conn = require(http);

      const req = conn.request(options, res => {
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => resolve({ result: 'success', data: Buffer.concat(data).toString(), params }));
        res.on('error', error => reject({ result: 'fail', params, error }));
      });
      req.on('error', error => reject({ result: 'fail', params, error }));

      req.end();

    } catch (error) {
      reject({ result: 'fail', params, error })
    }
  });
}

/**
 * Does a basic republish of the page or component
 * @param {Object} params
 */
function republish(params) {
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


/*******************************************************************************************
 *                                     Version 1.0                                         *
 *******************************************************************************************/
const v1 = {
  _get,
  _chunk,
  prettyJSON,
  toYaml,
  clone,
  parseHost,
  esQuery,
  clayImport,
  clayExport,
  httpGet,
  republish,
  httpRequest,
};

module.exports = {
  v1,
};