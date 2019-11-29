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

// must be set before importing usingDb, if it exists
const pgIndex = process.argv.indexOf('-pg');
if (pgIndex !== -1) {
  [
    process.env.PGHOST,
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
  ] = process.argv.splice(pgIndex, 5).slice(1);
}

const fs = require('fs');
const util = require('util');
const _get = require('../../app/node_modules/lodash/get');
const _has = require('../../app/node_modules/lodash/has');
const _set = require('../../app/node_modules/lodash/set');
const _chunk = require('../../app/node_modules/lodash/chunk');
const claycli = require('../../app/node_modules/claycli');
const YAML = require('../../app/node_modules/yamljs');
const url = require('url');
const usingDb = require('./using-db');
const httpGet = require('./http-get');
const httpRequest = require('./http-request');
const makeHttpEs = require('./make-http-es');
const elasticsearch = require('./elasticsearch');

const DEFAULT_HOST = 'clay.radio.com';
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': 'token accesskey',
};
const HTTP = { http: 'http' };
const HTTPS = { http: 'https' };

// The following are simple, self-explanatory functions, so no jsdocs given
const prettyJSON = obj => JSON.stringify(obj, null, 2);
const toYaml = obj => YAML.stringify(obj, 8, 2);
const clone = obj => obj && JSON.parse(JSON.stringify(obj));
const readFileAsync = util.promisify(fs.readFile);
const getFileText = path => readFileAsync(path, 'utf-8');


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

  return httpRequest({ http, options });
}

/**
 *
 * @param {Object} params
 * @returns {Promise<any>}
 */
function readFile(params) {
  const { path } = params;
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      error
        ? reject({ result: 'fail', params, error })
        : resolve({ result: 'success', data, params });
    });
  });
}

/**
 * Handles running sql against postgres
 * @param {string} sql the sql to execute
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQL(sql, ...args) {
  let rows;

  try {
    await usingDb.v1(async db =>
      rows = (await db.query(sql, args)).rows
    );
    return rows || [];
  } catch (error) {
    console.error('There was an error while executing SQL.\n\n', { error, args });
  }
}

/**
 * Handles retrieving a sql file and running it against postgres immediately
 * @param {string} path path to .sql file
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQLFile(path, ...args) {
  return executeSQL(await getFileText(path), ...args);
}

/**
 * Similar to executeSQL, handles running a SQL query, however, it runs it in a transaction and
 * will rollback any changes if an error occurs during the transaction.
 * if the query returns any data, so will this
 * @param {string} path path to .sql file
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQLFileTrans(path, ...args) {
  let rows;

  await usingDb.v1(async db => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      rows = (await client.query(await getFileText(path), args)).rows;
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(
        'There was an error while executing SQL.\nTransaction Was Rolled Back.\n\n',
        { error, path, args });
    } finally {
      client.release();
    }
  });

  return rows || [];
}

/*******************************************************************************************
 *                                     Version 1.0                                         *
 *******************************************************************************************/
const v1 = {
  DEFAULT_HEADERS,
  _get,
  _has,
  _set,
  _chunk,
  prettyJSON,
  toYaml,
  clone,
  parseHost,
  esQuery,
  clayImport,
  clayExport,
  httpGet: httpGet.v1,
  republish,
  httpRequest: httpRequest.v1,
  readFile,
  usingDb: usingDb.v1,
  readFileAsync,
  getFileText,
  executeSQL,
  executeSQLFile,
  executeSQLFileTrans,
  makeHttpEs: makeHttpEs.v1,
  elasticsearch: elasticsearch.v1
};

module.exports = { v1 };
