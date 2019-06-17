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
  const { canonicalUrl, syndicatedUrl, headline, seoHeadline, feedImgUrl, seoDescription, stationURL, stationTitle, subHeadline, featured } = data,
    link = `${canonicalUrl}`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    transform = [
      {
        title: { _cdata: headline }
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
        syndicatedUrl
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
      },
      {
        seoHeadline: { _cdata: seoHeadline }
      },
      {
        coverImage: feedImgUrl
      },
      {
        featured
      }
    ];

  if (data.slides) {
    transform.push({
      slides: { _cdata: renderContent(data.slides, locals)}
    });
  }

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
