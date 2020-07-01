'use strict';

// based off of the reversechron transform

const cheerio = require('cheerio'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  { addArrayOfProps, renderContent } = require('./utils'),
  { getComponentInstance } = require('clayutils'),
  __ = {
    /**
     * Sanitizes HTML by removing all script tags.
     *
     * @param {string} htmlStr
     * @returns {function}
     */
    removeScripts: htmlStr => {
      const $ = cheerio.load(htmlStr);

      $('script').remove();

      return $('body').html();
    }
  };

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
  const { _id, canonicalUrl, syndicatedUrl, headline, seoHeadline, feedImgUrl, seoDescription, stationURL, stationTitle, subHeadline, featured } = data,
    link = `${canonicalUrl}`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    itemId = getComponentInstance(_id),
    renderSanitizedContent = (content, opts = {}) => {
      const { renderContentParams = [] } = opts;

      content = renderContent(content, locals, ...renderContentParams);

      return __.removeScripts(content);
    },
    transform = [
      { title: { _cdata: headline } },
      { link },
      // Date format must be RFC 822 compliant
      { pubDate: format(parse(data.date), 'ddd, DD MMM YYYY HH:mm:ss ZZ') },
      { guid: [{ _attr: { isPermaLink: false } }, itemId] },
      { syndicatedUrl },
      { description: { _cdata: seoDescription } },
      { 'content:encoded': { _cdata: renderSanitizedContent(data.content) } },
      { stationUrl: stationURL },
      { stationTitle },
      { subHeadline },
      { seoHeadline: { _cdata: seoHeadline } },
      { 'radio:coverImage': feedImgUrl },
      { featured }
    ];

  if (data.slides) {
    transform.push({
      slides: { _cdata: renderSanitizedContent(data.slides) }
    });
  }

  if (data.lead) {
    const opts = { renderContentParams: [null, { lead: true }] };

    transform.push({
      lead: { _cdata: renderSanitizedContent(data.lead, opts) }
    });
  }

  if (data.footer) {
    const footerContent = renderSanitizedContent(data.footer);

    if (footerContent) {
      transform.push({
        footer: { _cdata: footerContent }
      });
    }
  }

  // Add the tags
  addArrayOfProps(data.tags, 'category', transform);
  // Add the authors
  addArrayOfProps(data.authors, 'dc:creator', transform);

  if (data.editorialFeeds) {
    // Convert editorialFeeds object with terms as keys with boolean values into array of truthy terms
    const editorialFeeds = Object.keys(data.editorialFeeds).filter(term => {return data.editorialFeeds[term];});

    // Add the editorial feeds terms
    addArrayOfProps(editorialFeeds, 'editorialFeeds', transform);
  }

  return transform;
};

module.exports._internals = __;
