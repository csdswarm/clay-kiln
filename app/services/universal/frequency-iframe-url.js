'use strict';

const url = require('url'),
  /** Determine the Frequency drupal url
 *
 * @param  {String} pathname shows/show-schedule
 * @param  {String} hostname clay.radio.com
 * @param  {String} callsign KROQFM
 * @return {String} Url https://kroqfm.dev-radio-drupal.com/shows/show-schedule?theme=radiocom
 */
  sanitizeUrl = (pathname, hostname, callsign) => {
    const endpoints = {
        'clay.radio.com': 'dev-radio-drupal.com',
        'dev-clay.radio.com': 'dev-radio-drupal.com',
        'stg-clay.radio.com': 'stg-radio-drupal.com',
        'preprod-clay.radio.com': 'prd-radio-drupal.com',
        'www.radio.com': 'prd-radio-drupal.com'
      },
      host = endpoints[hostname] || 'dev-radio-drupal.com',
      queryString = '?theme=radiocom',
      [,,...rest] = pathname.split('/');

    return `https://${callsign}.${host}/${rest}${queryString}`.replace(/,/gi,'/');
  };

/**
 * Determines frequency url from the Unity URL
 * i.e. http://clay.radio.com/kroq/shows/show-schedule
 * and return the proper frequency url
 * i.e. https://kroqfm.dev-radio-drupal.com/shows/show-schedule?theme=radiocom
 *
 * @param  {String} urlString
 * @param  {String} callsign
 * @return {String}
 */

function frequencyIframeUrl(urlString, callsign) {
  const { pathname, hostname } = url.parse(urlString),
    frequencyUrl = sanitizeUrl(pathname, hostname , callsign.toLowerCase());
    
  return frequencyUrl;
}

module.exports = frequencyIframeUrl;
