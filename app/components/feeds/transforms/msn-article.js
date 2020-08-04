'use strict';

const format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps, renderContentAsync } = require('./utils'),
  // these skipped components are mostly due to the specs outlined here
  // https://partnerhub.msn.com/docs/spec/vcurrent/using-html/AAsCn
  componentsToSkip = new Set([
    // we need to skip html-embed because we don't know what elements will be
    //   inside and thus whether it makes sense to skip the unsupported elements
    //   or omit the content altogether.
    //
    // currently business wants these to be skipped, though it's possible they
    //   later decide articles with html-embeds should be omitted from the feed.
    'html-embed',

    // iframe for audio not supported
    'omny'
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
      content,
      feedImg,
      lead,
      link,
      msnTitle,
      seoDescription
    } = data,
    renderAsync = cmpt => {
      return renderContentAsync(cmpt, locals, 'msn', componentsToSkip);
    },
    [leadHtml, contentHtml, feedImgElement] = await Promise.all([
      renderAsync(lead),
      renderAsync(content),
      renderAsync(feedImg)
    ]),
    xmlObj = [
      {
        title: { _cdata: msnTitle }
      },
      {
        // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
        link
      },
      {
        // Date format must be RFC 822 compliant
        pubDate: format(parse(data.date), 'ddd, DD MMM YYYY HH:mm:ss ZZ')
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
      }
    ];

  // the feed image may not fit msn's requirements, in which case it will
  //   return empty
  if (feedImgElement) {
    // we need to JSON.parse it because the result of renderContent is a string
    xmlObj.push(JSON.parse(feedImgElement));
  }

  addArrayOfProps(data.tags, 'category', xmlObj);
  addArrayOfProps(data.authors, 'dc:creator', xmlObj);

  return xmlObj;
};
