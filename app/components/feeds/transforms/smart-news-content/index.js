'use strict';

const parseDate = require('date-fns/parse'),
  { addArrayOfProps, renderContent } = require('../utils'),
  comscoreScript = require('./comscore-script'),
  gaScript = require('./ga-script'),
  // details about why the components are skipped can be found in the specs here
  // https://publishers.smartnews.com/hc/en-us/articles/360010977793
  componentsToSkip = new Set([
    // skipping for now.  We will probably have to revisit how to handle this
    //    because I think some articles rely heavily on html-embed content
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
  const { canonicalUrl, content, headline, lead, seoDescription } = data,
    link = `${canonicalUrl}`,
    [leadHtml, contentHtml] = await Promise.all([
      renderContent(lead, locals, 'smart-news', componentsToSkip),
      renderContent(content, locals, 'smart-news', componentsToSkip)
    ]),
    xmlObj = [
      {
        title: { _cdata: headline }
      },
      {
        // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
        link
      },
      {
        // Date format must be RFC 822 compliant
        pubDate: parseDate(data.date).toUTCString()
      },
      {
        guid: [link]
      },
      {
        description: { _cdata: seoDescription }
      },
      {
        'content:encoded': {
          _cdata: leadHtml + contentHtml
        }
      },
      {
        'snf:analytics': {
          _cdata: comscoreScript + gaScript
        }
      }
    ];

  addArrayOfProps(data.tags, 'category', xmlObj);
  addArrayOfProps(data.authors, 'dc:creator', xmlObj);

  return xmlObj;
};
