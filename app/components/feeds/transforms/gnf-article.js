'use strict';

const format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps, addGnfImage, renderContent } = require('./utils'),
  contentFormat = 'gnf';

/**
 * Create an array who represents one article's
 * data as it conforms to the `xml` package's API
 *
 * http://npmjs.com/package/xml
 * @param {Object} data
 * @param {Object} locals
 * @return {Array}
 */
module.exports = async (data, locals) => {
  const {
      canonicalUrl,
      content,
      feedImgUrl,
      headline,
      seoDescription
    } = data,
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
        guid: canonicalUrl
      },
      {
        description: { _cdata: seoDescription }
      },
      {
        'content:encoded': { _cdata: await addGnfImage(feedImgUrl) + renderContent(content, locals, contentFormat) }
      }
    ];

  // Add the tags
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors
  addArrayOfProps(data.authors, 'dc:creator', transform);

  return transform;
};
