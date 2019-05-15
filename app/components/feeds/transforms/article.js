'use strict';

const format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps, renderContent } = require('./utils');

/**
 * Create an array who represents one article's
 * data as it conforms to the `xml` package's API
 *
 * http://npmjs.com/package/xml
 * @param {Object} data
 * @param {Object} locals
 * @return {Array}
 */
module.exports = function (data, locals) {
  const { canonicalUrl, primaryHeadline, seoDescription, stationURL, stationTitle, subHeadline } = data,
    link = `${canonicalUrl}`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    transform = [
      {
        title: { _cdata: primaryHeadline }
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
        description: { _cdata: seoDescription }
      },
      {
        'content:encoded': { _cdata: renderContent(data.content, locals)}
      },
      {
        stationUrl: stationURL
      },
      {
        stationTitle
      },
      {
        subHeadline
      }
    ];

  // Add the tags
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors
  addArrayOfProps(data.authors, 'dc:creator', transform);
  // Add the image
  // return addRssMediaImage(firstAndParse(dataContent, 'image'), transform)
  //   .then(() => transform);

  // We HAVE to return a promise because of how NYMag setup the Highland render pipeline
  return Promise.resolve(transform);
};
