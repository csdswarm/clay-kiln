'use strict';

const _get = require('lodash/get'),
  _reduce = require('lodash/reduce'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps } = require('./utils'),

  render = {
    paragraph: (data) => {
      const text = _get(data, 'text', '');

      return text ? `<p>${text}</p>` : '';
    }
  };

/**
 * Compose article content from select components
 * @param {Object} data
 * @returns {string}
 */
function composeArticleContent(data) {
  return _reduce(data.content, (res, cmpt) => {
    const ref = _get(cmpt, '_ref', ''),
      cmptData = JSON.parse(_get(cmpt, 'data', '{}'));

    if (ref.includes('/paragraph/')) {
      res += render.paragraph(cmptData);
    }

    return res;
  }, '');
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
  const { canonicalUrl, plaintextPrimaryHeadline } = data,
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
        'content:encoded': { _cdata: composeArticleContent(data)}
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
