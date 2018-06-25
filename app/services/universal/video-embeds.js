'use strict';

var parse = require('url-parse'),
  _includes = require('lodash/includes');

/**
 * parse the starttime from a string into an interger (number of seconds)
 * @param  {string} timestamp original timestamp from youtube, e.g. '4m20s'
 * @return {number}           number of seconds
 */
function parseYoutubeTimestamp(timestamp) {
  var min = parseInt(timestamp.match(/\d+m/)),
    sec = parseInt(timestamp.match(/\d+s/));

  return min * 60 + sec;
}

function catchEmbedCodes(possibleHtml) {
  if (_includes(possibleHtml, '<iframe') || _includes(possibleHtml, '<object')) {
    // url is not actually a url, but rather a jumble of html!
    throw new Error('Not a valid url!');
  }
}

/**
 * try to get the youtube id
 * this function handles all the various types of youtube embed urls that exist
 * @param {object} parsed
 * @param {object} [query]
 * @throws {Error} if it can't match a valid youtube url format
 * @returns {string}
 */
function getYoutubeID(parsed, query) {
  // try to get the ID
  if (query && query.v) {
    // regular urls, e.g. youtube.com/watch?v=[id]
    return query.v;
  } else if (parsed.pathname && _includes(parsed.pathname, 'embed')) {
    // old embed urls, e.g. youtube.com/embed/[id]
    return parsed.pathname.substr(7);
  } else if (parsed.pathname && _includes(parsed.pathname, '/v/')) {
    // new embed urls, e.g. youtube.com/v/[id]
    return parsed.pathname.substr(3);
  } else if (parsed.pathname && !_includes(parsed.pathname, 'watch')) {
    // short urls, e.g. youtu.be/[id]
    return parsed.pathname.substr(1); // remove the initial slash
  } else {
    throw new Error('Not a valid youtube url!');
  }
}

/**
 * map all the various types of youtube embeds
 * @param  {string} url youtube video url
 * @return {string}     html (iframe) with the latest embed syntax
 */
function youtube(url) {
  var parsed = parse(url, true),
    query = parsed.query,
    id, startTime, timestamp;

  catchEmbedCodes(url);
  id = getYoutubeID(parsed, query);

  // try to get the start time
  if (query && query.t) {
    // time is in a query string, e.g. ?t=4m20s
    startTime = '&start=' + parseYoutubeTimestamp(query.t).toString();
  } else if (parsed.hash && _includes(parsed.hash, '#t=')) {
    // time is in a hash, e.g. #t=4m20s
    timestamp = parsed.hash.substr(3); // chop off '#t='

    startTime = '&start=' + parseYoutubeTimestamp(timestamp).toString();
  } else {
    // "Begin at the beginning, and go on till you come to the end" -Lewis Carroll
    startTime = '';
  }

  // build the embed html
  return '<iframe class="youtube-player" type="text/html" src="//www.youtube.com/embed/' + id + '?rel=0&enablejsapi=1' + startTime + '" allowfullscreen frameborder="0"></iframe>';
}

/**
 * map all magnify/wayfire video urls
 * @param  {string} url video url, e.g. http://videos.nymag.com/video/Mayor-Bloomberg-on-Curb-Your-En#c=LPM0DP0F0XHZ168D&t=Mayor%20Bloomberg%20on%20%27Curb%20Your%20Enthusiasm%27
 * @return {string}     iframe embed with a munged url
 */
function magnify(url) {
  var parsed = parse(url, true),
    cleanUrl = parsed.protocol + '//' + parsed.host + parsed.pathname; // take off all the hash mess from the end of legacy urls

  return '<iframe src="' + cleanUrl + '/player?layout=&amp;read_more=1" frameborder="0" scrolling="no"></iframe>'; // holy hardcoded iframes, batman!
}

module.exports.youtube = youtube;
module.exports.magnify = magnify;
module.exports.getYoutubeID = getYoutubeID;
