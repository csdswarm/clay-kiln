'use strict';

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
 *   rel="nofollow" attribute.  See commit message for why.
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
        // see commit message for the purpose of this line
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

    // This selector tells cheerio to grab the content inside <body>.
    //   * See commit message for why.
    return $('body').html();
  };
}

/**
 * Create an array who represents the content's data as it conforms to the `xml`
 *   package's API
 *
 * http://npmjs.com/package/xml
 * @param {Object} data
 * @param {Object} locals
 * @return {Array}
 */
module.exports = function (data, locals) {
  const {
      _id,
      featured,
      featuredNews,
      featuredSports,
      feedImgUrl,
      headline,
      link,
      seoDescription,
      seoHeadline,
      stationTitle,
      stationURL,
      subHeadline,
      syndicatedUrl
    } = data,
    sanitizeNoFollow = makeSanitizeNoFollow(locals),
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
      { featured: featured || false },
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

  addArrayOfProps(data.tags, 'category', transform);
  addArrayOfProps(data.authors, 'dc:creator', transform);

  if (data.editorialFeeds) {
    const editorialFeeds = Object.keys(data.editorialFeeds)
      .filter(term => data.editorialFeeds[term]);

    addArrayOfProps(editorialFeeds, 'editorialFeeds', transform);
  }

  return transform;
};
