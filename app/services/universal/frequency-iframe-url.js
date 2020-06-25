'use strict';

const url = require('url');

/**
 * Determines frequency url from the url
 * and return the proper frequency url
 * i.e https://1010wins.radio.com/shows/show-schedule
 *
 * @param  {String} urlString
 * @return {String}
 */

function frequencyIframeUrl(urlString) {
  const { pathname } = url.parse(urlString),
    [,stationSlug,...rest] = pathname.split('/'),
    frequencyUrl = `https://${stationSlug}.radio.com/${rest}`.replace(',','/');
  
  return frequencyUrl;
}

module.exports = frequencyIframeUrl;
