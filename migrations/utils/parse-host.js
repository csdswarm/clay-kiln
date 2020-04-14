'use strict';

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

const v1 = parseHost ;

module.exports = { v1 };
