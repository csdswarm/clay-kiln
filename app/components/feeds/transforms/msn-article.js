'use strict';

const format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  mimeTypes = require('mime-types'),
  db = require('amphora-storage-postgres'),
  { addArrayOfProps, renderContentAsync } = require('./utils'),
  feedImage = require('../../feed-image/model'),
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
  const { canonicalUrl, msnTitle, feedImg, seoDescription } = data,
    link = `${canonicalUrl}`;

  // this workaround is due to the article upgrade not being run on rss render,
  //   meaning this may run on old content initially.  We can rely on feedImg
  //   being an object with a _ref once recent articles have all been upgraded
  //   (shouldn't take long).
  let feedImgData = { _computed: {} };

  if (feedImg) {
    const feedImgRef = feedImg._ref.replace('@published', '');

    // we need the computed prop 'useInMsnFeed'
    feedImgData = await feedImage.render(
      feedImgRef,
      await db.get(feedImgRef),
      locals
    );
  }

  const xmlObj = [
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
        _cdata: await renderContentAsync(data.content, locals, 'msn', componentsToSkip)
      }
    }
  ];

  if (feedImgData._computed.useInMsnFeed) {
    xmlObj.push({
      'media:content': {
        _attr: {
          url: feedImgData.url,
          medium: 'image',
          type: mimeTypes.lookup(feedImgData.url)
        }
      }
    });
  }

  addArrayOfProps(data.tags, 'category', xmlObj);
  addArrayOfProps(data.authors, 'dc:creator', xmlObj);

  return xmlObj;
};
