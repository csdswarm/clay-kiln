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

  const { canonicalUrl, plaintextPrimaryHeadline, featured } = data,
    link = `${canonicalUrl}`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
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
        description: { _cdata: data.socialDescription }
      },
      {
        'content:encoded': { _cdata: renderContent(data.content, locals)}
      },
      {
        featured
      }
    ];

  // Add the tags
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors
  addArrayOfProps(data.authors, 'dc:creator', transform);
  // Add the image
  // return addRssMediaImage(firstAndParse(dataContent, 'image'), transform)
  //   .then(() => transform);

  if (data.editorialFeeds) {
    // Convert editorialFeeds object with terms as keys with boolean values into array of truthy terms
    const editorialFeeds = Object.keys(data.editorialFeeds).filter(term => {return data.editorialFeeds[term];});

    // Add the editorial feeds terms
    addArrayOfProps(editorialFeeds, 'editorialFeeds', transform);
  }

  // We HAVE to return a promise because of how NYMag setup the Highland render pipeline
  return Promise.resolve(transform);
};
