'use strict';

// note: rss is used loosely here because this feed adds a lot of elements
//       needed by frequency that aren't valid per the rss spec.

const _pull = require('lodash/pull'),
  cheerio = require('cheerio'),
  exists = require('lodash/identity'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  Url = require('url-parse'),
  { addArrayOfProps, renderContent } = require('./utils'),
  { getComponentInstance } = require('clayutils'),
  { getDomainFromHostname } = require('../../../services/universal/utils');

/**
 * Returns a function which sanitizes html to ensure all links have the proper
 *   rel="nofollow" attribute.
 *
 * Why ?
 *
 * Syndicated content needs to have the proper rel="nofollow" attribute on all
 *   links.  Unfortunately our solution to handle this exists inside a method
 *   which sanitizes the html as a whole rather than within each component.
 *   Currently the only feed requested to maintain this rel="nofollow" is the
 *   frequency feed which renders components separately.  This solution isn't
 *   ideal but is at least a stop-gap til we need this done more places.  I
 *   think the long-term goal would be to add rel="nofollow" logic
 *   per component.
 *
 * @param {object} locals
 * @returns {function}
 */
function makeSanitizeNoFollow(locals) {
  const entercomDomains = new Set(locals.ENTERCOM_DOMAINS);

  return htmlStr => {
    const $ = cheerio.load(htmlStr);

    $('a[href]').each((_idx, el) => {
      const cEl = $(el),
        // rel "must have a value that is an unordered set of unique
        //   space-separated keywords"
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel
        //
        // even though our app only seems to expect and use 'nofollow', we
        //   should allow others.
        relVals = (cEl.attr('rel') || '').split(/\s+/).filter(exists),
        href = new Url(cEl.attr('href')),
        domain = getDomainFromHostname(href.hostname);

      _pull(relVals, 'nofollow');

      if (!entercomDomains.has(domain)) {
        relVals.push('nofollow');
      }

      if (relVals.length) {
        cEl.attr('rel', relVals.join(' '));
      } else {
        cEl.removeAttr('rel');
      }
    });

    // I couldn't find a way to output just the contents of the string we
    //   loaded. When the string we're parsing doesn't exist within an <html>
    //   block, .html() creates one along with a <body>.  This selector tells
    //   cheerio to grab the content inside <body>.
    return $('body').html();
  };
}

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
  const { _id, canonicalUrl, syndicatedUrl, headline, seoHeadline, feedImgUrl, seoDescription, stationURL, stationTitle, subHeadline, featured, featuredNews, featuredSports } = data,
    sanitizeNoFollow = makeSanitizeNoFollow(locals),
    link = `${canonicalUrl}`, // the `link` prop gets urlencoded elsewhere so no need to encode ampersands here
    itemId = getComponentInstance(_id),
    renderSanitizedContent = (content, opts = {}) => {
      const { renderContentParams = [] } = opts;

      content = renderContent(content, locals, ...renderContentParams);

      return sanitizeNoFollow(content);
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
      { coverImage: feedImgUrl },
      { featured },
      { featured_sports: featuredSports || false },
      { featured_news: featuredNews || false }
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
