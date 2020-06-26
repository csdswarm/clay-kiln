'use strict';

const url = require('url'),
  /** Determine the Frequency drupal url
 *
 * @param  {String} pathname shows/show-schedule
 * @param  {String} hostname radio.com
 * @param  {String} callsign winsam
 * @return {String} Url https://winsam.prd-radio-drupal.com/shows/show-schedule
 */
  sanitizeUrl = (pathname, hostname, callsign) => {
    let host;
    
    switch (hostname) {
      case 'dev-clay-radio.com':
        host = 'dev-radio-drupal.com';
        break;
      case 'stg-clay-radio.com':
        host = 'stg-radio-drupal.com';
        break;
      default:
        host = 'prd-radio-drupal.com';
        break;
    }
    
    const [,,...rest] = pathname.split('/');

    return `https://${callsign}.${host}/${rest}`.replace(/,/gi,'/');
  };

/**
 * Determines frequency url from the Unity URL
 * i.e. https://radio.com/1010wins/shows/show-schedule
 * and return the proper frequency url
 * i.e. https://winsam.prd-radio-drupal.com/shows/show-schedule
 *
 * @param  {String} urlString
 * @param  {String} callsign
 * @return {String}
 */

function frequencyIframeUrl(urlString, callsign) {
  const { pathname, hostname } = url.parse(urlString),
    frequencyUrl = sanitizeUrl(pathname, hostname, callsign.toLowerCase());
    
  return frequencyUrl;
}

module.exports = frequencyIframeUrl;
