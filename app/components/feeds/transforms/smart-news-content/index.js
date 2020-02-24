'use strict';

const parseDate = require('date-fns/parse'),
  { addArrayOfProps, renderContentAsync } = require('../utils'),
  comscoreScript = require('./comscore-script'),
  gaScript = require('./ga-script'),
  // details about why the components are skipped can be found in the specs here
  // https://publishers.smartnews.com/hc/en-us/articles/360010977793
  componentsToSkip = new Set([
    // we need to skip html-embed because we don't know what elements will be
    //   inside and thus whether it makes sense to skip the unsupported elements
    //   or omit the content altogether.
    //
    // currently business wants these to be skipped, though it's possible they
    //   later decide articles with html-embeds should be omitted from the feed.
    'html-embed',

    // script not supported
    'facebook-post',

    // iframe for this content is not supported
    'omny',
    'verizon-media'
  ]);

/**
 * create the xml representation of the article in the msn feed format
 *
 * details about the xml object format can be found here:
 * http://npmjs.com/package/xml
 *
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
      lead,
      seoDescription
    } = data,
    link = `${canonicalUrl}`,
    [leadHtml, contentHtml] = await Promise.all([
      renderContentAsync(lead, locals, 'smart-news', componentsToSkip),
      renderContentAsync(content, locals, 'smart-news', componentsToSkip)
    ]),
    xmlObj = [
      { title: { _cdata: headline } },
      // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
      { link },
      // Date format must be RFC 822 compliant
      { pubDate: parseDate(data.date).toUTCString() },
      { guid: [link] },
      { description: { _cdata: seoDescription } },
      {
        'content:encoded': {
          _cdata: leadHtml + contentHtml
        }
      },
      { 'media:thumbnail': { _attr: {
        url: feedImgUrl
      } } },
      { 'snf:analytics': { _cdata: comscoreScript } },
      { 'snf:analytics': { _cdata: gaScript } }
    ];

  addArrayOfProps(data.tags, 'category', xmlObj);
  addArrayOfProps(data.authors, 'dc:creator', xmlObj);

  return xmlObj;
};
