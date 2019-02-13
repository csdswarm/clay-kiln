'use strict';

const _get = require('lodash/get'),
  _truncate = require('lodash/truncate'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { firstAndParse, addArrayOfProps, addRssMediaImage } = require('./utils');

/**
 * Given a clay-paragraph component, create an excerpt
 * that is limited to 300 characters of text and then
 * a readmore link
 *
 * @param {Object} paragraph
 * @param {String} link
 * @param {String} headline
 * @param {Array} transform
 */
function addTeaser(paragraph, link, headline, transform) {
  const text = _get(paragraph, 'text', ''),
    string = `${_truncate(text, { length: 300 })} <a href="${link.replace(/&/g, '&amp;')}" title="Click here to read more about ${headline}">More &raquo;</a>`;

  transform.push({
    'content:encoded': { _cdata: string }
  });
}

/**
 * Create an array who represents one article's
 * data as it conforms to the `xml` package's API
 *
 * http://npmjs.com/package/xml
 * @param  {Object} data
 * @return {Array}
 */
module.exports = function (data) {
  const { canonicalUrl, content, relatedInfo, plaintextPrimaryHeadline, utmSource, utmMedium } = data,
    link = `${canonicalUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=feed-part`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    transform = [
      {
        title: { _cdata: plaintextPrimaryHeadline }
      },
      {
        link
      },
      {
        pubDate: format(parse(data.date), 'ddd, DD MMM YYYY HH:mm:ss ZZ') // Date format must be RFC 822 compliant
      },
      {
        guid: [{ _attr: { isPermaLink: false } }, canonicalUrl]
      },
      {
        comments: `${canonicalUrl}#comments`
      },
      {
        description: { _cdata: data.socialDescription }
      }
    ],
    dataContent = content || relatedInfo;

  // Add the tags
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors
  addArrayOfProps(data.authors, 'dc:creator', transform);
  // Add the first clay paragraph
  addTeaser(firstAndParse(dataContent, 'clay-paragraph'), link, plaintextPrimaryHeadline, transform);
  // Add the image
  return addRssMediaImage(firstAndParse(dataContent, 'mediaplay-image'), transform)
    .then(() => transform);
};
