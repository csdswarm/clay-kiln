'use strict';
const setDbCredentials = require('./set-db-credentials').v1;

const DEFAULT_HOST = 'clay.radio.com';
const HTTP = { http: 'http' };
const HTTPS = { http: 'https' };

/**
 * given a host, attempts to get the configured values for that host
 * @param {string} host
 * @returns {{http: string, es: {http: string, hostname: string}}}
 */
function getHostInfo(host) {
  const hostInfo = {
    [DEFAULT_HOST]: {
      ...HTTP,
      es: {...HTTP, hostname: DEFAULT_HOST, port: 9200},
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#Smart_self-overwriting_lazy_getters
      get env() {
        delete this.env;
        return this.env = setDbCredentials('local');
      },
    },
    'dev-clay.radio.com': {
      ...HTTPS,
      es: {...HTTP, hostname: 'dev-es.radio-dev.com', port: 9200},
      get env() {
        delete this.env;
        return this.env = setDbCredentials('development');
      },
    },
    'stg-clay.radio.com': {
      ...HTTPS,
      es: {...HTTP, hostname: 'es.radio-stg.com', port: 9200},
      get env() {
        delete this.env;
        return this.env = setDbCredentials('staging');
      },
    },
    'preprod-clay.radio.com': {
      ...HTTPS,
      es: {
        ...HTTPS,
        hostname: 'vpc-prdcms-preprod-elasticsearch-5hmjmnw62ednm5mbfifwdnntdm.us-east-1.es.amazonaws.com',
        port: 443
      },
      get env() {
        delete this.env;
        return this.env = setDbCredentials('pre-production');
      },
    },
    'www.radio.com': {
      ...HTTPS,
      es: {
        ...HTTPS,
        hostname: 'vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com',
        port: 443
      },
      get env() {
        delete this.env;
        return this.env = setDbCredentials('production');
      },
    },
  };
  return hostInfo[host];
}

/**
 * Gets environmental values for clay and elastic based on host
 * @param {string} host
 * @returns {Object}
 */
function parseHost_v1(host) {
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
 * the same as parseHost_v1 but with a 'host' property
 *
 * @param {string} host,
 * @returns {object}
 */
function parseHost_v2(host = DEFAULT_HOST) {
  return Object.assign({ host }, parseHost_v1(host));
}

/**
 * same as parseHost_v2, except now returns a promise and awaits for env updates to complete.
 * @param {string} host if not set, automatically grabs the first argument or default host if that was not provided
 * @returns {Promise<object>}
 */
async function parseHost_v3(host = process.argv[2] || DEFAULT_HOST) {
  const info = parseHost_v2(host);
  return { ...info, env: await Promise.resolve(info.env) };
}

module.exports = {
  v1: parseHost_v1,
  v2: parseHost_v2,
  v3: parseHost_v3,
};
