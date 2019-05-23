'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  { firstAndParse, addArrayOfProps, addRssMediaVideo } = require('./utils');

/**
 * Given a clay-paragraph component, create a description element
 *
 * @param {String} text
 * @param {Array} transform
 */
function addDescription({ text }, transform) {
  transform.push({ description: { _cdata: text }});
}

/**
 * Assemble a media:content element along with its
 * related child elements
 *
 * @param {Object} data
 * @param {Array} transform
 */
function addMediaContent(data, transform) {
  var contentVideoData = JSON.parse(_get(data, 'contentVideo.data', '')),
    { videoId, videoDuration } = contentVideoData,
    { feedImgUrl, plaintextShortHeadline, teaser } = data;

  addRssMediaVideo(
    {
      title: plaintextShortHeadline,
      description: teaser,
      thumbnailUrl: feedImgUrl
    },
    [
      { _attr: { url: `https://www.youtube.com/watch?v=${videoId}`, duration: videoDuration, medium: 'video', expression: 'full' } },
      { 'media:player': { _attr: { url: `https://www.youtube.com/watch?v=${videoId}` }}}
    ],
    transform
  );
}

/**
 * Map `site` value to formatted brand label
 *
 * @param {String} site
 * @returns {String}
 */
function getBrandLabel(site) {
  site = site ? site.toLowerCase() : site;
  switch (site) {
    case 'vulture':
      return 'Vulture';
    case 'wwwthecut':
      return 'The Cut';
    case 'di':
      return 'Daily Intel';
    case 'grubstreet':
      return 'Grub Street';
    case 'selectall':
      return 'Select All';
    case 'strategist':
      return 'The Strategist';
    default:
      return 'New York Magazine';
  }
}

/**
 * Create an array that represents the data for one lede-video's
 * data as it conforms to the `xml` package's API
 * http://npmjs.com/package/xml
 *
 * Note: content formatted for MSN's MRSS
 * http://feedexamples.ingestion.microsoft.com/
 *
 * @param  {Object} data
 * @return {Array}
 */
module.exports = function (data) {
  var contentVideoData = JSON.parse(_get(data, 'contentVideo.data', '{}')),
    { videoId } = contentVideoData,
    { plaintextPrimaryHeadline, plaintextShortHeadline, teaser, site, canonicalUrl, date, utmSource, utmMedium } = data,
    firstParagraph = _isEmpty(data.relatedInfo) ? {} : firstAndParse(data.relatedInfo, 'clay-paragraph'),
    transform = [{
      title: plaintextPrimaryHeadline
    }, {
      'mi:shortTitle': plaintextShortHeadline
    }, {
      'dc:alternative': teaser
    }, {
      'dc:publisher': getBrandLabel(site)
    }, {
      link: `${canonicalUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=feed-part`
    }, {
      pubDate: date
    }, {
      guid: videoId
    }, {
      'dc:modified': date
    }];

  // Add the optional description, if it exists
  if (_isEmpty(firstParagraph)) {
    transform.push({ description: { _cdata: teaser }});
  } else {
    addDescription(firstParagraph, transform);
  }
  // Add the tags
  addArrayOfProps(data.tags, 'media:keywords', transform);
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors, add the brand if no author exists
  if (_isEmpty(firstParagraph)) {
    transform.push({ 'dc:creator': getBrandLabel(site) });
  } else {
    addArrayOfProps(data.authors, 'dc:creator', transform);
  }
  // Add the media
  addMediaContent(data, transform);

  return Promise.resolve(transform);
};

// exposed for testing
module.exports.getBrandLabel = getBrandLabel;
module.exports.addMediaContent = addMediaContent;
