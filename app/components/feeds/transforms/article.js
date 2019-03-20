'use strict';

const _get = require('lodash/get'),
  _reduce = require('lodash/reduce'),
  _each = require('lodash/each'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps } = require('./utils'),
  fs = require('fs'),
  render = {
    paragraph: (data) => {
      const text = _get(data, 'text', '');
      return text ? hbs.partials.paragraph({ text }) : '';
    }
  },
  nymagHbs = require('clayhandlebars'), 
  hbs = nymagHbs(), 
  glob = require('glob'),
  // searches the components directories for any feed.hbs files
  templates = glob.sync('../../**/feed.hbs');

// compile the feed.hbs files
_each(templates, (template) => {
  let match = template.match(/components\/([^\/]+)\//);
  if (match) {
    hbs.partials[`feed-${match[1]}`] = hbs.compile(`${fs.readFileSync(template)}`, { preventIndent: true });
  }
});

/**
 * Compose article content from select components
 * @param {Object} data
 * @returns {string}
 */
function composeArticleContent(data) {
  return _reduce(data.content, (res, cmpt) => {
    const ref = _get(cmpt, '_ref', ''),
      cmptData = JSON.parse(_get(cmpt, 'data', '{}')),
      match = ref.match(/_components\/([^\/]+)\//);
      
    if (match && cmptData && hbs.partials[`feed-${match[1]}`]) {
      // render the component and add it to the response
      res += hbs.partials[`feed-${match[1]}`](cmptData);
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
