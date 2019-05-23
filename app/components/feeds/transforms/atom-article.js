'use strict';

const h = require('highland'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { firstAndParse } = require('./utils'),
  {
    buildLedeImage,
    mapImageCollection,
    mergeContent,
    wrapAuthorProp,
    wrapCategoryProp
  } = require('./atom-utils');

/**
 * Parses and combines the content data into a single string
 *
 * @param {Object} content Contains ref to the component and data
 * @returns {string} A string containing the parsed content data
 */
function parseContent(content) {
  return h(content)
    .map(({ ref, data }) => ({ ref, data: JSON.parse(data) }))
    .reduce('', mergeContent);
}

/**
 * Creates an array that represents an article's
 * data as it conforms to the `xml` package's API
 *
 * http://npmjs.com/package/xml
 * @param  {Object} data
 * @return {Array}
 */
module.exports = function (data) {
  const {
      authors,
      canonicalUrl,
      content,
      date,
      plaintextPrimaryHeadline,
      relatedInfo,
      socialDescription,
      tags,
      utmMedium,
      utmSource
    } = data,
    dataContent = content || relatedInfo,
    imageCollection = firstAndParse(dataContent, 'image-collection'),
    link = `${canonicalUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=feed-part`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    ledeImageHtml = buildLedeImage({
      ledeImgUrl: data.feedImgUrl,
      ledeCredit: data.ledeCreditOverride || data.ledeCredit,
      ledeCaption: data.ledeCaption
    }),
    entryBody = [{
      id: link
    }, {
      title: plaintextPrimaryHeadline
    }, {
      link: { _attr: { rel: 'self', href: link } }
    }, {
      updated: format(parse(date), 'YYYY-MM-DDTHH:mm:ssZ') // Date format must be RFC 3339 compliant
    }, {
      summary: socialDescription
    }, ...wrapAuthorProp(authors), ...wrapCategoryProp(tags)];

  if (imageCollection) {
    entryBody.push({ 'media:group': mapImageCollection(imageCollection) });
  }

  return parseContent(dataContent)
    .collect()
    .toPromise(Promise)
    .then(mergedContent => [
      ...entryBody,
      {
        content: {
          _attr: { type: 'html' },
          _cdata: `${ledeImageHtml}${mergedContent}`
        }
      }
    ]);
};
